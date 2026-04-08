/**
 * WebSocket 状态管理 (Pinia)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WebSocketMessage } from '@/types/game';

export const useWebSocketStore = defineStore('websocket', () => {
  // ===== 状态 =====
  const ws = ref<WebSocket | null>(null);
  const connected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT = 5;

  // ===== 方法 =====

  /**
   * 连接 WebSocket
   */
  function connect(url: string): Promise<void> {
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
          console.log('WebSocket 已连接');
          resolve();
        };

        ws.value.onclose = () => {
          connected.value = false;
          console.log('WebSocket 已断开');
        };

        ws.value.onerror = (err) => {
          connected.value = false;
          console.error('WebSocket 错误', err);
          reject(err);
        };

        // 超时处理
        setTimeout(() => {
          if (!connected.value) {
            reject(new Error('连接超时'));
          }
        }, 10000);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 发送消息
   */
  function send(data: WebSocketMessage): boolean {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.error('WebSocket 未连接，无法发送消息', data);
      return false;
    }
    try {
      ws.value.send(JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('WebSocket 发送失败', err);
      return false;
    }
  }

  /**
   * 设置消息处理器
   */
  function onMessage(callback: (data: WebSocketMessage) => void) {
    if (ws.value) {
      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.error('WebSocket 消息解析失败', err);
        }
      };
    }
  }

  /**
   * 断开连接
   */
  function disconnect() {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    connected.value = false;
  }

  return {
    // 状态
    ws,
    connected,
    reconnectAttempts,
    
    // 方法
    connect,
    send,
    onMessage,
    disconnect
  };
});
