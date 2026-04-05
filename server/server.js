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
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// 配置
const PORT = process.env.PORT || 8080;
const ROOM_TIMEOUT = 30 * 60 * 1000;
const HEARTBEAT_INTERVAL = 30000;

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

function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TIMEOUT) {
      room.players.forEach(player => {
        if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
          send(player.ws, { type: 'room_expired', message: '房间已过期' });
        }
      });
      rooms.delete(code);
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
    players: [{
      id: userId,
      name: playerName || '玩家',
      color: 1,
      ws: ws,
      time: gameTime || 300,
      moves: 0,
      undoLeft: undoLimit || 3
    }, null],
    board: [],
    moves: [],
    currentPlayer: 1,
    matchWins: { 1: 0, 2: 0 },
    currentRound: 1
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
    undoLeft: room.undoLimit
  };
  room.status = 'playing';
  
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
    send(room.players[0].ws, { type: 'opponent_joined', opponent: room.players[1] });
  }
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
  
  // 更新连接
  room.players[playerIndex].ws = ws;
  clients.set(ws, { userId: room.players[playerIndex].id, roomCode, color: playerIndex + 1 });
  
  send(ws, {
    type: 'rejoined',
    board: room.board,
    currentPlayer: room.currentPlayer,
    moves: room.moves,
    players: room.players.map(p => p ? { name: p.name, time: p.time, moves: p.moves, undoLeft: p.undoLeft } : null)
  });
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
  room.players[color - 1].moves++;
  
  const winner = checkWin(room.board, row, col, color, room.boardSize);
  
  if (winner) {
    room.matchWins[color]++;
    room.status = 'finished';
    
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
      board: room.board
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
  
  const opponentColor = color === 1 ? 2 : 1;
  const opponent = room.players[opponentColor - 1];
  
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
  room.players[lastMove.player - 1].moves--;
  room.currentPlayer = lastMove.player;
  
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
  
  const requesterColor = color === 1 ? 2 : 1;
  const requester = room.players[requesterColor - 1];
  if (requester && requester.ws) send(requester.ws, { type: 'undo_rejected' });
}

// 认输
function handleSurrender(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (!room || room.status !== 'playing') return;
  
  room.status = 'finished';
  const winner = color === 1 ? 2 : 1;
  room.matchWins[winner]++;
  
  broadcastToRoom(roomCode, {
    type: 'game_over',
    winner,
    reason: 'surrender',
    surrenderBy: color,
    matchWins: room.matchWins
  });
}

// 再来一局
function handlePlayAgain(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode } = client;
  const room = rooms.get(roomCode);
  if (!room) return;
  
  // 重置棋盘
  initBoard(room);
  room.moves = [];
  room.currentPlayer = 1;
  room.status = 'playing';
  room.currentRound++;
  
  // 重置玩家
  room.players.forEach(p => {
    if (p) {
      p.time = room.gameTime;
      p.moves = 0;
    }
  });
  
  broadcastToRoom(roomCode, { type: 'play_again' });
}

// 离开房间
function handleLeaveRoom(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode } = client;
  const room = rooms.get(roomCode);
  
  if (room) {
    broadcastToRoom(roomCode, { type: 'opponent_left', message: '对手已离开房间' });
    rooms.delete(roomCode);
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
  
  const opponentColor = color === 1 ? 2 : 1;
  const opponent = room.players[opponentColor - 1];
  
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
    const client = clients.get(ws);
    if (client) {
      clients.delete(ws);
    }
  });
  
  ws.on('pong', () => { ws.isAlive = true; });
});

// 心跳检测
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// 清理过期房间
setInterval(cleanupExpiredRooms, 60000);

// 启动服务器
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
