/**
 * 五子棋在线对战 WebSocket 服务器
 * 
 * 功能：
 * - 房间管理（创建、加入、离开、重连）
 * - 密码验证
 * - 实时落子同步
 * - 胜利连线检测
 * - 悔棋系统（次数限制）
 * - 比赛模式（三局两胜/五局三胜）
 * - 快捷消息/表情
 * - 心跳检测
 * - 掉线检测与通知
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// 配置
const PORT = process.env.PORT || 8080;
const ROOM_TIMEOUT = 30 * 60 * 1000;      // 空闲房间超时时间（30分钟）
const RECONNECT_TIMEOUT = 60 * 1000;      // 掉线重连等待时间（60秒）
const HEARTBEAT_INTERVAL = 30000;         // 心跳检测间隔（30秒）

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      rooms: rooms.size,
      connections: wss.clients.size,
      uptime: process.uptime()
    }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Gomoku WebSocket Server');
});

const wss = new WebSocket.Server({ server });
const rooms = new Map();
const clients = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateUserId() {
  return crypto.randomBytes(8).toString('hex');
}

// 清理过期房间
function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    let shouldDelete = false;
    let reason = '';

    // 1. waiting 状态超过 30 分钟
    if (room.status === 'waiting' && now - room.createdAt > ROOM_TIMEOUT) {
      shouldDelete = true;
      reason = '等待超时';
    }
    // 2. finished 状态超过 5 分钟
    else if (room.status === 'finished' && now - room.finishedAt > 5 * 60 * 1000) {
      shouldDelete = true;
      reason = '游戏结束超时';
    }
    // 3. playing 状态，但所有玩家都掉线超过 5 分钟
    else if (room.status === 'playing') {
      const allDisconnected = room.players.every(p =>
        !p.ws || p.ws.readyState !== WebSocket.OPEN
      );
      const allDisconnectedLong = room.players.every(p =>
        p.disconnectedAt && now - p.disconnectedAt > 5 * 60 * 1000
      );

      if (allDisconnected && allDisconnectedLong) {
        shouldDelete = true;
        reason = '所有玩家掉线超时';
      }
    }

    if (shouldDelete) {
      // 通知所有在线玩家
      room.players.forEach(player => {
        if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
          send(player.ws, {
            type: 'room_expired',
            message: `房间已过期（${reason}）`
          });
        }
      });
      rooms.delete(code);
      console.log(`房间 ${code} 已清理 (${reason})`);
    }
  }
}

function send(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastToRoom(roomCode, data, excludeWs = null) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.players.forEach(player => {
    if (player && player.ws && player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      send(player.ws, data);
    }
  });
}

// 处理玩家掉线
function handlePlayerDisconnect(ws) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomCode, color } = client;
  const room = rooms.get(roomCode);

  if (!room) {
    clients.delete(ws);
    return;
  }

  // 修复：找到掉线玩家在 players 数组中的实际索引
  const playerIndex = room.players.findIndex(p => p && p.ws === ws);
  if (playerIndex === -1) {
    clients.delete(ws);
    return;
  }

  const player = room.players[playerIndex];
  if (player) {
    player.ws = null;  // 清除 ws 引用
    player.disconnectedAt = Date.now();
  }

  clients.delete(ws);

  // 如果游戏正在进行，通知对手
  if (room.status === 'playing') {
    // 修复：通过 WebSocket 连接对比来找到实际对手
    const opponent = room.players.find(p => p && p.ws && p.ws !== ws);

    if (opponent && opponent.ws && opponent.ws.readyState === WebSocket.OPEN) {
      send(opponent.ws, {
        type: 'opponent_disconnected',
        message: '对手已掉线，等待重连...',
        reconnectTimeout: RECONNECT_TIMEOUT
      });
    }

    // 设置重连超时
    room.reconnectTimer = setTimeout(() => {
      // 超时未重连，判定掉线方输掉当前局
      if (room.players[playerIndex] && !room.players[playerIndex].ws) {
        // 找到掉线方的实际身份（房主还是加入者）
        const disconnectedPlayer = room.players[playerIndex];
        const isHost = disconnectedPlayer && disconnectedPlayer.id === room.hostId;

        // 根据身份更新比分（而不是根据color）
        if (isHost) {
          // 房主掉线，加入者得分
          room.matchWins[2]++;
        } else {
          // 加入者掉线，房主得分
          room.matchWins[1]++;
        }

        // 检查比赛是否结束
        const targetWins = Math.ceil(room.matchMode / 2);
        const matchEnded = room.matchWins[1] >= targetWins || room.matchWins[2] >= targetWins;

        if (matchEnded) {
          // 比赛结束
          room.status = 'finished';
          room.finishedAt = Date.now();
        } else {
          // 比赛未结束，当前局结束，可以继续下一局
          room.status = 'finished';
          room.finishedAt = Date.now();
        }

        room.playAgainRequested = false;  // 清除标志位，允许新的"再来一局"请求

        if (opponent && opponent.ws && opponent.ws.readyState === WebSocket.OPEN) {
          // 修复：根据对手的实际身份来确定 winner
          const winner = isHost ? 2 : 1;  // 房主掉线，加入者赢；加入者掉线，房主赢
          send(opponent.ws, {
            type: 'game_over',
            winner: winner,
            reason: 'disconnect',
            matchWins: room.matchWins,
            matchEnded: matchEnded
          });
        }

        console.log(`玩家 ${disconnectedPlayer?.name || color} 掉线超时，房间 ${roomCode} 结束，比分 ${room.matchWins[1]}:${room.matchWins[2]}`);
      }
    }, RECONNECT_TIMEOUT);
  }
  
  // 如果是等待中的房间，房主掉线则删除房间
  if (room.status === 'waiting' && color === 1) {
    rooms.delete(roomCode);
    console.log(`房主掉线，房间 ${roomCode} 已删除`);
  }
}

// 创建房间
function handleCreateRoom(ws, data) {
  const { playerName, password, gameTime, boardSize, matchMode, undoLimit } = data;
  
  let roomCode;
  do { roomCode = generateRoomCode(); } while (rooms.has(roomCode));
  
  const userId = generateUserId();
  
  const room = {
    code: roomCode,
    password: password || '',
    hasPassword: !!password,
    hostId: userId,
    status: 'waiting',
    gameTime: gameTime || 300,
    boardSize: boardSize || 15,
    matchMode: matchMode || 1,
    undoLimit: undoLimit || 3,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),  // 最后活动时间
    players: [{
      id: userId,
      name: playerName || '玩家',
      color: 1,
      ws: ws,
      time: gameTime || 300,
      moves: 0,
      undoLeft: undoLimit || 3,
      disconnectedAt: null
    }, null],
    board: [],
    moves: [],
    currentPlayer: 1,
    matchWins: { 1: 0, 2: 0 },
    currentRound: 1,
    reconnectTimer: null,
    playAgainRequested: false  // 防止重复处理"再来一局"请求
  };
  
  initBoard(room);
  rooms.set(roomCode, room);
  clients.set(ws, { userId, roomCode, color: 1 });
  
  send(ws, {
    type: 'room_created',
    roomCode,
    userId,
    color: 1,
    matchMode: room.matchMode,
    undoLimit: room.undoLimit
  });
  
  console.log(`房间 ${roomCode} 已创建，创建者: ${playerName}`);
}

function initBoard(room) {
  room.board = [];
  for (let i = 0; i < room.boardSize; i++) {
    room.board[i] = [];
    for (let j = 0; j < room.boardSize; j++) room.board[i][j] = 0;
  }
}

// 获取房间列表
function handleGetRoomList(ws) {
  const roomList = [];
  for (const [code, room] of rooms) {
    if (room.status === 'waiting') {
      roomList.push({
        code: room.code,
        hostName: room.players[0]?.name || '未知',
        hasPassword: room.hasPassword,
        gameTime: room.gameTime,
        boardSize: room.boardSize,
        matchMode: room.matchMode,
        createdAt: room.createdAt
      });
    }
  }
  send(ws, { type: 'room_list', rooms: roomList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20) });
}

// 加入房间
function handleJoinRoom(ws, data) {
  const { roomCode, playerName, password } = data;
  const room = rooms.get(roomCode);
  
  if (!room) { send(ws, { type: 'error', message: '房间不存在' }); return; }
  if (room.status !== 'waiting') { send(ws, { type: 'error', message: '房间已开始' }); return; }
  if (room.hasPassword && room.password !== password) { send(ws, { type: 'error', message: '密码错误' }); return; }
  
  const userId = generateUserId();
  
  room.players[1] = {
    id: userId,
    name: playerName || '玩家',
    color: 2,
    ws: ws,
    time: room.gameTime,
    moves: 0,
    undoLeft: room.undoLimit,
    disconnectedAt: null
  };
  room.status = 'playing';
  room.lastActivityAt = Date.now();
  
  clients.set(ws, { userId, roomCode, color: 2 });
  
  send(ws, {
    type: 'room_joined',
    roomCode,
    userId,
    color: 2,
    opponent: room.players[0],
    gameTime: room.gameTime,
    boardSize: room.boardSize,
    matchMode: room.matchMode,
    undoLimit: room.undoLimit
  });
  
  if (room.players[0] && room.players[0].ws) {
    send(room.players[0].ws, { 
      type: 'opponent_joined', 
      opponent: room.players[1],
      gameTime: room.gameTime,
      boardSize: room.boardSize,
      matchMode: room.matchMode,
      undoLimit: room.undoLimit
    });
  }
  
  console.log(`玩家 ${playerName} 加入房间 ${roomCode}`);
}

// 重连房间
function handleRejoinRoom(ws, data) {
  const { roomCode, playerName } = data;
  const room = rooms.get(roomCode);
  
  if (!room) { send(ws, { type: 'error', message: '房间不存在' }); return; }
  
  // 找到该玩家的位置
  let playerIndex = -1;
  for (let i = 0; i < room.players.length; i++) {
    if (room.players[i] && room.players[i].name === playerName) {
      playerIndex = i;
      break;
    }
  }
  
  if (playerIndex === -1) { send(ws, { type: 'error', message: '未找到玩家' }); return; }
  
  // 清除重连定时器
  if (room.reconnectTimer) {
    clearTimeout(room.reconnectTimer);
    room.reconnectTimer = null;
  }
  
  // 更新连接
  room.players[playerIndex].ws = ws;
  room.players[playerIndex].disconnectedAt = null;
  // 修复：使用实际的 color 值，而不是 playerIndex+1
  clients.set(ws, { userId: room.players[playerIndex].id, roomCode, color: room.players[playerIndex].color });

  send(ws, {
    type: 'rejoined',
    board: room.board,
    currentPlayer: room.currentPlayer,
    moves: room.moves,
    players: room.players.map(p => p ? { name: p.name, time: p.time, moves: p.moves, undoLeft: p.undoLeft } : null),
    playerIndex: playerIndex,  // 添加：告诉前端自己在 players 数组中的位置
    color: room.players[playerIndex].color  // 添加：告诉前端当前的执子颜色
  });

  // 修复：通过玩家位置来找到对手，而不是使用 color 值
  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const opponent = room.players[opponentIndex];
  if (opponent && opponent.ws && opponent.ws.readyState === WebSocket.OPEN) {
    send(opponent.ws, { type: 'opponent_reconnected', message: '对手已重连' });
  }
  
  console.log(`玩家 ${playerName} 重连房间 ${roomCode}`);
}

// 落子
function handlePlacePiece(ws, data) {
  const client = clients.get(ws);
  if (!client) { send(ws, { type: 'error', message: '未加入房间' }); return; }
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (!room || room.status !== 'playing') { send(ws, { type: 'error', message: '游戏未开始' }); return; }
  
  const { row, col } = data;
  
  if (room.currentPlayer !== color) { send(ws, { type: 'error', message: '不是你的回合' }); return; }
  if (row < 0 || row >= room.boardSize || col < 0 || col >= room.boardSize) { send(ws, { type: 'error', message: '无效位置' }); return; }
  if (room.board[row][col] !== 0) { send(ws, { type: 'error', message: '位置已有棋子' }); return; }
  
  room.board[row][col] = color;
  room.moves.push({ row, col, player: color, time: Date.now() });

  // 修复：找到当前执子颜色对应的玩家在 players 数组中的实际索引
  const currentPlayerIndex = room.players.findIndex(p => p && p.color === color);
  if (currentPlayerIndex !== -1) {
    room.players[currentPlayerIndex].moves++;
  }

  room.lastActivityAt = Date.now();
  
  const winner = checkWin(room.board, row, col, color, room.boardSize);

  if (winner) {
    // 更新比分：根据玩家的实际身份（房主/加入者）来更新
    // room.players[0]是房主，room.players[1]是加入者
    // color是当前的执子颜色，需要找到这个color对应的玩家
    const winningPlayer = room.players.find(p => p && p.color === color);
    if (winningPlayer) {
      // 判断是房主还是加入者
      if (winningPlayer.id === room.hostId) {
        room.matchWins[1]++; // 房主得分
      } else {
        room.matchWins[2]++; // 加入者得分
      }
    }

    room.status = 'finished';
    room.finishedAt = Date.now();
    room.playAgainRequested = false;  // 清除标志位，允许新的"再来一局"请求

    broadcastToRoom(roomCode, {
      type: 'game_over',
      winner: color,
      winningMove: { row, col },
      board: room.board,
      matchWins: room.matchWins
    });
  } else {
    room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
    
    broadcastToRoom(roomCode, {
      type: 'piece_placed',
      row, col,
      player: color,
      currentPlayer: room.currentPlayer,
      board: room.board,
      players: room.players.map(p => p ? {
        time: p.time,
        moves: p.moves,
        undoLeft: p.undoLeft,
        color: p.color
      } : null)
    });
  }
}

function checkWin(board, row, col, player, size) {
  const directions = [[[0, 1], [0, -1]], [[1, 0], [-1, 0]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];
  
  for (const dir of directions) {
    let count = 1;
    for (const [dr, dc] of dir) {
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

// 悔棋请求
function handleUndoRequest(ws) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomCode, color } = client;
  const room = rooms.get(roomCode);

  if (!room || room.status !== 'playing' || room.moves.length === 0) return;

  // 修复：通过 WebSocket 连接对比来找到实际对手
  const opponent = room.players.find(p => p && p.ws && p.ws !== ws);

  if (opponent && opponent.ws) {
    send(opponent.ws, { type: 'undo_request', playerName: room.players[color - 1].name });
  }
}

// 悔棋接受
function handleUndoAccept(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (!room || room.status !== 'playing' || room.moves.length === 0) return;

  const lastMove = room.moves.pop();
  room.board[lastMove.row][lastMove.col] = 0;

  // 修复：找到上一步落子的玩家在 players 数组中的实际索引
  const lastPlayerIndex = room.players.findIndex(p => p && p.color === lastMove.player);
  if (lastPlayerIndex !== -1) {
    room.players[lastPlayerIndex].moves--;
  }

  room.currentPlayer = lastMove.player;
  room.lastActivityAt = Date.now();
  
  // 通知双方
  broadcastToRoom(roomCode, { type: 'undo_accepted' });
}

// 悔棋拒绝
function handleUndoReject(ws) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  if (!room) return;

  // 修复：通过 WebSocket 连接对比来找到实际对手
  const opponent = room.players.find(p => p && p.ws && p.ws !== ws);
  if (opponent && opponent.ws) send(opponent.ws, { type: 'undo_rejected' });
}

// 认输
function handleSurrender(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (!room || room.status !== 'playing') return;

  room.status = 'finished';
  room.finishedAt = Date.now();
  room.playAgainRequested = false;  // 清除标志位，允许新的"再来一局"请求

  // 修复：根据认输玩家的实际身份（房主/加入者）来更新比分，而不是根据 color 值
  const surrenderingPlayer = room.players.find(p => p && p.color === color);
  const isHost = surrenderingPlayer && surrenderingPlayer.id === room.hostId;
  const winner = isHost ? 2 : 1;  // 房主认输，加入者赢；加入者认输，房主赢
  room.matchWins[winner]++;

  broadcastToRoom(roomCode, {
    type: 'game_over',
    winner,
    reason: 'surrender',
    surrenderBy: color,
    matchWins: room.matchWins
  });
}

// 再来一局（双方确认机制）
function handlePlayAgain(ws) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.status !== 'finished') {
    send(ws, { type: 'error', message: '游戏未结束' });
    return;
  }

  // 初始化准备状态数组（如果不存在）
  if (!room.playAgainReady) {
    room.playAgainReady = [false, false];
  }

  // 修复：通过 WebSocket 连接对比来找到实际对手，而不是使用 color 值
  const opponent = room.players.find(p => p && p.ws && p.ws !== ws);
  if (!opponent || !opponent.ws) {
    send(ws, { type: 'error', message: '对手已离线' });
    return;
  }

  // 修复：找到当前玩家在 players 数组中的实际索引，而不是使用 color-1
  const playerIndex = room.players.findIndex(p => p && p.ws === ws);
  if (playerIndex === -1) {
    send(ws, { type: 'error', message: '未找到玩家信息' });
    return;
  }

  // 设置该玩家准备状态
  room.playAgainReady[playerIndex] = true;

  // 检查比赛是否结束
  const targetWins = Math.ceil(room.matchMode / 2);
  const matchEnded = room.matchWins[1] >= targetWins || room.matchWins[2] >= targetWins;

  // 如果双方都准备好了，开始新游戏
  if (room.playAgainReady[0] && room.playAgainReady[1]) {
    if (matchEnded) {
      // 比赛结束，再赛一轮：重置比分和局数
      room.matchWins = { 1: 0, 2: 0 };
      room.currentRound = 1;
    } else {
      // 比赛进行中，下一局：增加局数
      room.currentRound++;
    }
    startNewGame(room);
  }

  // 通知双方准备状态
  broadcastToRoom(roomCode, {
    type: 'play_again_status',
    ready: room.playAgainReady,
    matchWins: room.matchWins,
    currentRound: room.currentRound
  });
}

// 开始新游戏
function startNewGame(room) {
  // 重置棋盘
  initBoard(room);
  room.moves = [];
  room.currentPlayer = 1;
  room.status = 'playing';
  room.lastActivityAt = Date.now();
  room.finishedAt = null;

  // 重置玩家
  room.players.forEach(p => {
    if (p) {
      p.time = room.gameTime;
      p.moves = 0;
    }
  });

  // 交换颜色（只交换color属性，不交换玩家数组位置）
  const tempColor = room.players[0].color;
  room.players[0].color = room.players[1].color;
  room.players[1].color = tempColor;

  // 更新 clients 映射（color已经改变）
  if (room.players[0] && room.players[0].ws) {
    clients.set(room.players[0].ws, { userId: room.players[0].id, roomCode: room.code, color: room.players[0].color });
  }
  if (room.players[1] && room.players[1].ws) {
    clients.set(room.players[1].ws, { userId: room.players[1].id, roomCode: room.code, color: room.players[1].color });
  }

  // 重置准备状态
  room.playAgainReady = [false, false];

  // 广播游戏开始
  broadcastToRoom(room.code, {
    type: 'play_again',
    currentRound: room.currentRound,
    players: room.players.map(p => p ? {
      name: p.name,
      time: p.time,
      moves: p.moves,
      undoLeft: p.undoLeft,
      color: p.color,
      id: p.id
    } : null),
    matchWins: room.matchWins,
    matchMode: room.matchMode
  });
}

// 离开房间
function handleLeaveRoom(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (room) {
    broadcastToRoom(roomCode, { type: 'opponent_left', message: '对手已离开房间' }, ws);
    rooms.delete(roomCode);
    console.log(`房间 ${roomCode} 已删除（玩家主动离开）`);
  }
  
  clients.delete(ws);
}

// 快捷消息
function handleQuickMsg(ws, data) {
  const client = clients.get(ws);
  if (!client) return;

  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  if (!room) return;

  // 修复：通过 WebSocket 连接对比来找到实际对手，而不是使用 color 值作为数组索引
  // 这样可以确保无论 color 值如何变化（第二局交换先后手后），都能正确发送给对手
  const opponent = room.players.find(p => p && p.ws && p.ws !== ws);

  if (opponent && opponent.ws) {
    send(opponent.ws, { type: 'quick_msg', message: data.message, playerName: room.players[color - 1].name });
  }
}

// 表情
function handleEmoji(ws, data) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode, color } = client;
  broadcastToRoom(roomCode, { type: 'emoji', emoji: data.emoji, playerColor: color });
}

// WebSocket 连接处理
wss.on('connection', (ws) => {
  ws.isAlive = true;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping': send(ws, { type: 'pong' }); break;
        case 'create_room': handleCreateRoom(ws, data); break;
        case 'get_room_list': handleGetRoomList(ws); break;
        case 'join_room': handleJoinRoom(ws, data); break;
        case 'rejoin_room': handleRejoinRoom(ws, data); break;
        case 'place_piece': handlePlacePiece(ws, data); break;
        case 'undo_request': handleUndoRequest(ws); break;
        case 'undo_accept': handleUndoAccept(ws); break;
        case 'undo_reject': handleUndoReject(ws); break;
        case 'surrender': handleSurrender(ws); break;
        case 'play_again': handlePlayAgain(ws); break;
        case 'leave_room': handleLeaveRoom(ws); break;
        case 'quick_msg': handleQuickMsg(ws, data); break;
        case 'emoji': handleEmoji(ws, data); break;
        
        
        default: send(ws, { type: 'error', message: '未知消息类型' });
      }
    } catch (err) {
      send(ws, { type: 'error', message: '消息格式错误' });
    }
  });
  
  ws.on('close', () => {
    handlePlayerDisconnect(ws);
  });
  
  ws.on('pong', () => { ws.isAlive = true; });
});

// 心跳检测
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      // 心跳超时，触发掉线处理
      handlePlayerDisconnect(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// 清理过期房间
setInterval(cleanupExpiredRooms, 60000);

// 游戏计时器：每秒更新所有进行中房间的玩家时间
setInterval(() => {
  rooms.forEach((room, roomCode) => {
    if (room.status === 'playing' && room.players[0] && room.players[1]) {
      // 获取当前执子玩家
      const currentPlayerIndex = room.players.findIndex(p => p && p.color === room.currentPlayer);
      if (currentPlayerIndex !== -1) {
        // 减少当前玩家的时间
        room.players[currentPlayerIndex].time--;
        
        // 检查是否超时
        if (room.players[currentPlayerIndex].time <= 0) {
          // 当前玩家超时，判负
          const winnerColor = room.currentPlayer === 1 ? 2 : 1;
          
          // 更新比分
          const winningPlayer = room.players.find(p => p && p.color === winnerColor);
          if (winningPlayer) {
            if (winningPlayer.id === room.hostId) {
              room.matchWins[1]++;
            } else {
              room.matchWins[2]++;
            }
          }
          
          room.status = 'finished';
          room.finishedAt = Date.now();
          room.playAgainRequested = false;
          
          broadcastToRoom(roomCode, {
            type: 'game_over',
            winner: winnerColor,
            winningMove: null,
            board: room.board,
            matchWins: room.matchWins,
            reason: 'timeout',
            timeoutPlayer: room.currentPlayer
          });
        }
      }
    }
  });
}, 1000);

// ==================== 启动服务器 ====================
server.listen(PORT, () => {
  console.log(`Gomoku WebSocket Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  wss.clients.forEach((ws) => send(ws, { type: 'server_shutdown', message: '服务器正在关闭' }));
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
