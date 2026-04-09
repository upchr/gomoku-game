import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WebSocketMessage, Room } from '@/types/game';

const WS_SERVER = new URLSearchParams(window.location.search).get('ws') ||
  (import.meta.env.VITE_GITHUB_PAGES ? 'wss://gomoku-game-production.up.railway.app' : '/ws');

export const useWebSocketStore = defineStore('websocket', () => {
  const ws = ref<WebSocket | null>(null);
  const connected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT = 5;
  const roomList = ref<Room[]>([]);
  const pingInterval = ref<ReturnType<typeof setInterval> | null>(null);

  let messageHandler: ((data: WebSocketMessage) => void) | null = null;

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
            setTimeout(() => connect(url), 3000);
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
      nickname: config.nickname
    });
  }

  function joinRoom(roomCode: string, nickname: string, password?: string) {
    send({
      type: 'join_room',
      roomCode,
      nickname,
      password: password || ''
    });
  }

  function getRoomList() {
    send({ type: 'get_room_list' });
  }

  function rejoinRoom(roomCode: string, userId: string) {
    send({ type: 'rejoin_room', roomCode, userId });
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

  return {
    ws, connected, reconnectAttempts, roomList,
    connect, send, onMessage, disconnect,
    createRoom, joinRoom, getRoomList, rejoinRoom,
    placePiece, requestUndo, acceptUndo, rejectUndo,
    surrender, playAgain, leaveRoom,
    sendQuickMsg, sendEmoji
  };
});
