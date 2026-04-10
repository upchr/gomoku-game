import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WebSocketMessage, Room } from '@/types/game';

const WS_SERVER = new URLSearchParams(window.location.search).get('ws') ||
  (import.meta.env.VITE_GITHUB_PAGES ? 'wss://gomoku-game-production.up.railway.app' : '/ws');

export const useWebSocketStore = defineStore('websocket', () => {
  const ws = ref<WebSocket | null>(null);
  const connected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT = 20; // 增加重连次数
  const roomList = ref<Room[]>([]);
  const pingInterval = ref<ReturnType<typeof setInterval> | null>(null);
  const savedRoomInfo = ref<{ roomCode: string; myName: string; myUserId: string; isHost: boolean; myColor: number } | null>(null);

  let messageHandler: ((data: WebSocketMessage) => void) | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  function connect(url: string = WS_SERVER): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws.value && ws.value.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        ws.value = new WebSocket(url);

        ws.value.onopen = () => {
          connected.value = true;
          reconnectAttempts.value = 0;
          startPing();
          if (messageHandler) {
            ws.value!.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                messageHandler!(data);
              } catch (err) {
                console.error('WebSocket message parse error', err);
              }
            };
          }
          resolve();
        };

        ws.value.onclose = () => {
          connected.value = false;
          stopPing();
          if (reconnectAttempts.value < MAX_RECONNECT) {
            reconnectAttempts.value++;
            // 尝试自动重连并重新加入房间
            autoReconnect();
          } else {
            // 重连次数用完，清理房间信息
            clearRoomInfo();
            // 通知用户重连失败
            console.error('重连失败，请刷新页面重新连接');
            // 触发自定义事件，通知 UI 层
            window.dispatchEvent(new CustomEvent('websocket-reconnect-failed'));
          }
        };

        ws.value.onerror = (err) => {
          connected.value = false;
          reject(err);
        };

        setTimeout(() => {
          if (!connected.value) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (err) {
        reject(err);
      }
    });
  }

  function send(data: WebSocketMessage): boolean {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) return false;
    try {
      ws.value.send(JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function onMessage(callback: (data: WebSocketMessage) => void) {
    messageHandler = callback;
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.error('WebSocket message parse error', err);
        }
      };
    }
  }

  function disconnect() {
    stopPing();
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    connected.value = false;
    reconnectAttempts.value = MAX_RECONNECT;
  }

  function startPing() {
    stopPing();
    pingInterval.value = setInterval(() => {
      send({ type: 'ping' });
    }, 30000);
  }

  function stopPing() {
    if (pingInterval.value) {
      clearInterval(pingInterval.value);
      pingInterval.value = null;
    }
  }

  function createRoom(config: { password: string; time: number; size: number; matchMode: number; undoLimit: number; nickname: string }) {
    send({
      type: 'create_room',
      password: config.password,
      time: config.time,
      size: config.size,
      matchMode: config.matchMode,
      undoLimit: config.undoLimit,
      playerName: config.nickname
    });
  }

  function joinRoom(roomCode: string, nickname: string, password?: string) {
    send({
      type: 'join_room',
      roomCode,
      playerName: nickname,
      password: password || ''
    });
  }

  function getRoomList() {
    send({ type: 'get_room_list' });
  }

  function rejoinRoom(roomCode: string, userId: string, nickname: string) {
    send({ type: 'rejoin_room', roomCode, playerName: nickname });
  }

  function placePiece(row: number, col: number) {
    send({ type: 'place_piece', row, col });
  }

  function requestUndo() {
    send({ type: 'undo_request' });
  }

  function acceptUndo() {
    send({ type: 'undo_accept' });
  }

  function rejectUndo() {
    send({ type: 'undo_reject' });
  }

  function surrender() {
    send({ type: 'surrender' });
  }

  function playAgain() {
    send({ type: 'play_again' });
  }

  function leaveRoom() {
    send({ type: 'leave_room' });
  }

  function sendQuickMsg(msg: string) {
    send({ type: 'quick_msg', message: msg });
  }

  function sendEmoji(emoji: string) {
    send({ type: 'emoji', emoji });
  }

  function sendCustomMessage(message: string) {
    send({ type: 'quick_msg', message });
  }

  function saveRoomInfo(roomCode: string, myName: string, myUserId: string, isHost: boolean, myColor: number, gameMode: string) {
    savedRoomInfo.value = { roomCode, myName, myUserId, isHost, myColor, gameMode };
    // 保存到localStorage以便刷新页面后恢复
    try {
      localStorage.setItem('gomoku-room', JSON.stringify({ roomCode, myName, myUserId, isHost, myColor, gameMode }));
    } catch (e) {
      console.error('Failed to save room info:', e);
    }
  }

  function clearRoomInfo() {
    savedRoomInfo.value = null;
    try {
      localStorage.removeItem('gomoku-room');
    } catch (e) {
      console.error('Failed to clear room info:', e);
    }
  }

  function loadRoomInfo() {
    try {
      const saved = localStorage.getItem('gomoku-room');
      if (saved) {
        const info = JSON.parse(saved);
        savedRoomInfo.value = info;
        return info;
      }
    } catch (e) {
      console.error('Failed to load room info:', e);
    }
    return null;
  }

  async function autoReconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    const roomInfo = savedRoomInfo.value || loadRoomInfo();
    if (!roomInfo) {
      return false;
    }

    try {
      await connect();
      // 重新加入房间
      send({
        type: 'rejoin_room',
        roomCode: roomInfo.roomCode,
        userId: roomInfo.myUserId
      });
      return true;
    } catch (err) {
      console.error('Auto reconnect failed:', err);
      // 重试
      if (reconnectAttempts.value < MAX_RECONNECT) {
        reconnectTimeout = setTimeout(() => autoReconnect(), 3000);
      }
      return false;
    }
  }

  return {
    ws, connected, reconnectAttempts, roomList, savedRoomInfo,
    connect, send, onMessage, disconnect,
    createRoom, joinRoom, getRoomList, rejoinRoom,
    placePiece, requestUndo, acceptUndo, rejectUndo,
    surrender, playAgain, leaveRoom,
    sendQuickMsg, sendEmoji, sendCustomMessage,
    saveRoomInfo, clearRoomInfo, loadRoomInfo, autoReconnect
  };
});
