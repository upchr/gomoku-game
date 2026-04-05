/**
 * 五子棋在线对战 WebSocket 服务器
 * 
 * 功能：
 * - 房间管理（创建、加入、离开）
 * - 密码验证
 * - 实时落子同步
 * - 心跳检测
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// 配置
const PORT = process.env.PORT || 8080;
const ROOM_TIMEOUT = 30 * 60 * 1000; // 房间超时：30分钟
const HEARTBEAT_INTERVAL = 30000; // 心跳间隔：30秒

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 健康检查
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

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 房间存储
const rooms = new Map();

// 用户连接映射
const clients = new Map();

// 生成房间码
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 生成用户ID
function generateUserId() {
  return crypto.randomBytes(8).toString('hex');
}

// 清理过期房间
function cleanupExpiredRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TIMEOUT) {
      // 通知房间内所有玩家
      room.players.forEach(player => {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
          send(player.ws, { type: 'room_expired', message: '房间已过期' });
        }
      });
      rooms.delete(code);
      console.log(`Room ${code} expired and removed`);
    }
  }
}

// 发送消息
function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// 广播给房间内所有玩家
function broadcastToRoom(roomCode, data, excludeWs = null) {
  const room = rooms.get(roomCode);
  if (!room) return;
  
  room.players.forEach(player => {
    if (player.ws && player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      send(player.ws, data);
    }
  });
}

// 创建房间
function handleCreateRoom(ws, data) {
  const { playerName, password, gameTime, boardSize } = data;
  
  // 生成唯一房间码
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));
  
  const userId = generateUserId();
  
  const room = {
    code: roomCode,
    password: password || '',
    hasPassword: !!password,
    hostId: userId,
    status: 'waiting',
    gameTime: gameTime || 300,
    boardSize: boardSize || 15,
    createdAt: Date.now(),
    players: [
      {
        id: userId,
        name: playerName || '玩家',
        color: 1, // 黑方
        ws: ws,
        time: gameTime || 300,
        moves: 0
      },
      null // 白方位置
    ],
    board: [],
    moves: [],
    currentPlayer: 1
  };
  
  // 初始化棋盘
  for (let i = 0; i < room.boardSize; i++) {
    room.board[i] = [];
    for (let j = 0; j < room.boardSize; j++) {
      room.board[i][j] = 0;
    }
  }
  
  rooms.set(roomCode, room);
  
  // 保存客户端映射
  clients.set(ws, { userId, roomCode, color: 1 });
  
  send(ws, {
    type: 'room_created',
    roomCode,
    userId,
    color: 1,
    message: '房间创建成功'
  });
  
  console.log(`Room ${roomCode} created by ${playerName}`);
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
        createdAt: room.createdAt
      });
    }
  }
  
  send(ws, {
    type: 'room_list',
    rooms: roomList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20)
  });
}

// 加入房间
function handleJoinRoom(ws, data) {
  const { roomCode, playerName, password } = data;
  
  const room = rooms.get(roomCode);
  
  if (!room) {
    send(ws, { type: 'error', message: '房间不存在' });
    return;
  }
  
  if (room.status !== 'waiting') {
    send(ws, { type: 'error', message: '房间已开始或已关闭' });
    return;
  }
  
  if (room.hasPassword && room.password !== password) {
    send(ws, { type: 'error', message: '密码错误' });
    return;
  }
  
  const userId = generateUserId();
  
  // 加入房间
  room.players[1] = {
    id: userId,
    name: playerName || '玩家',
    color: 2, // 白方
    ws: ws,
    time: room.gameTime,
    moves: 0
  };
  room.status = 'playing';
  
  // 保存客户端映射
  clients.set(ws, { userId, roomCode, color: 2 });
  
  // 通知加入者
  send(ws, {
    type: 'room_joined',
    roomCode,
    userId,
    color: 2,
    opponent: room.players[0],
    gameTime: room.gameTime,
    boardSize: room.boardSize
  });
  
  // 通知房主
  const host = room.players[0];
  if (host && host.ws) {
    send(host.ws, {
      type: 'opponent_joined',
      opponent: room.players[1]
    });
  }
  
  console.log(`${playerName} joined room ${roomCode}`);
}

// 落子
function handlePlacePiece(ws, data) {
  const client = clients.get(ws);
  if (!client) {
    send(ws, { type: 'error', message: '未加入房间' });
    return;
  }
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (!room || room.status !== 'playing') {
    send(ws, { type: 'error', message: '游戏未开始' });
    return;
  }
  
  const { row, col } = data;
  
  // 检查是否轮到该玩家
  if (room.currentPlayer !== color) {
    send(ws, { type: 'error', message: '不是你的回合' });
    return;
  }
  
  // 检查位置是否有效
  if (row < 0 || row >= room.boardSize || col < 0 || col >= room.boardSize) {
    send(ws, { type: 'error', message: '无效位置' });
    return;
  }
  
  if (room.board[row][col] !== 0) {
    send(ws, { type: 'error', message: '该位置已有棋子' });
    return;
  }
  
  // 落子
  room.board[row][col] = color;
  room.moves.push({ row, col, player: color, time: Date.now() });
  room.players[color - 1].moves++;
  
  // 检查胜负
  const winner = checkWin(room.board, row, col, color, room.boardSize);
  
  if (winner) {
    room.status = 'finished';
    
    // 通知所有玩家
    broadcastToRoom(roomCode, {
      type: 'game_over',
      winner: color,
      winningMove: { row, col },
      board: room.board
    });
    
    // 删除房间
    setTimeout(() => rooms.delete(roomCode), 5000);
    
    console.log(`Game over in room ${roomCode}, winner: ${color}`);
  } else {
    // 切换玩家
    room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
    
    // 同步落子
    broadcastToRoom(roomCode, {
      type: 'piece_placed',
      row,
      col,
      player: color,
      currentPlayer: room.currentPlayer,
      board: room.board
    });
  }
}

// 检查胜负
function checkWin(board, row, col, player, size) {
  const directions = [
    [[0, 1], [0, -1]],   // 横向
    [[1, 0], [-1, 0]],   // 纵向
    [[1, 1], [-1, -1]], // 对角线
    [[1, -1], [-1, 1]]  // 反对角线
  ];
  
  for (const dir of directions) {
    let count = 1;
    
    for (const [dr, dc] of dir) {
      let r = row + dr;
      let c = col + dc;
      
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

// 认输
function handleSurrender(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (!room || room.status !== 'playing') return;
  
  room.status = 'finished';
  const winner = color === 1 ? 2 : 1;
  
  broadcastToRoom(roomCode, {
    type: 'game_over',
    winner,
    reason: 'surrender',
    surrenderBy: color
  });
  
  setTimeout(() => rooms.delete(roomCode), 5000);
  
  console.log(`Player ${color} surrendered in room ${roomCode}`);
}

// 离开房间
function handleLeave(ws) {
  const client = clients.get(ws);
  if (!client) return;
  
  const { roomCode, color } = client;
  const room = rooms.get(roomCode);
  
  if (room) {
    // 通知对手
    broadcastToRoom(roomCode, {
      type: 'opponent_left',
      message: '对手已离开'
    });
    
    // 删除房间
    rooms.delete(roomCode);
  }
  
  clients.delete(ws);
  console.log(`Client left room ${roomCode}`);
}

// 心跳检测
function heartbeat(ws) {
  ws.isAlive = true;
}

// WebSocket 连接处理
wss.on('connection', (ws) => {
  ws.isAlive = true;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          send(ws, { type: 'pong' });
          break;
          
        case 'create_room':
          handleCreateRoom(ws, data);
          break;
          
        case 'get_room_list':
          handleGetRoomList(ws);
          break;
          
        case 'join_room':
          handleJoinRoom(ws, data);
          break;
          
        case 'place_piece':
          handlePlacePiece(ws, data);
          break;
          
        case 'surrender':
          handleSurrender(ws);
          break;
          
        default:
          send(ws, { type: 'error', message: '未知消息类型' });
      }
    } catch (err) {
      console.error('Parse error:', err);
      send(ws, { type: 'error', message: '消息格式错误' });
    }
  });
  
  ws.on('close', () => {
    handleLeave(ws);
  });
  
  ws.on('pong', () => heartbeat(ws));
});

// 心跳检测定时器
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// 清理过期房间定时器
setInterval(cleanupExpiredRooms, 60000);

// 启动服务器
server.listen(PORT, () => {
  console.log(`Gomoku WebSocket Server running on port ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  wss.clients.forEach((ws) => {
    send(ws, { type: 'server_shutdown', message: '服务器正在关闭' });
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
