<template>
  <div>
    <!-- 聊天消息显示 -->
    <div
      v-if="gameState.gameMode === 'online' && gameState.chatMessages.length > 0"
      class="chat-messages"
    >
      <div
        v-for="msg in gameState.chatMessages.slice(-5)"
        :key="msg.id"
        :class="['chat-message', msg.sender === 'me' ? 'message-me' : 'message-opponent']"
      >
        <span v-if="msg.type === 'text'" class="message-text">{{ msg.text }}</span>
        <span v-else class="message-emoji">{{ msg.text }}</span>
      </div>
    </div>

    <!-- 快捷消息组 -->
    <div
      v-if="gameState.gameMode === 'online' && gameState.isPlaying"
      class="chat-bar"
    >
      <button class="quick-msg" @click="$emit('quick-msg', '你好！')">你好！</button>
      <button class="quick-msg" @click="$emit('quick-msg', '请稍等')">请稍等</button>
      <button class="quick-msg" @click="$emit('quick-msg', '好棋！')">好棋！</button>
      <button class="quick-msg" @click="$emit('quick-msg', 'GG')">GG</button>
      <button class="emoji-btn" @click="$emit('toggle-emoji')">😊</button>
    </div>

    <!-- 自定义消息输入框 -->
    <div
      v-if="gameState.gameMode === 'online' && gameState.isPlaying && showCustomInput"
      class="custom-input-container"
    >
      <input
        v-model="customMessage"
        type="text"
        placeholder="输入自定义消息..."
        maxlength="50"
        class="custom-input"
        @keyup.enter="sendCustomMessage"
      />
      <button class="btn-send" @click="sendCustomMessage" :disabled="!customMessage.trim()">
        发送
      </button>
      <button class="btn-close" @click="showCustomInput = false">
        ✕
      </button>
    </div>
  </div>

  <div class="controls">
    <div class="btn-row">
      <button
        v-if="gameState.gameMode === 'online' && !gameState.isPlaying"
        class="btn btn-success"
        :disabled="isReady"
        @click="$emit('ready')"
      >
        {{ isReady ? '已准备 ✓' : (gameState.matchEnded ? '再赛一轮' : '下一局') }}
      </button>

      <button
        v-if="gameState.isPlaying && gameState.gameMode === 'online'"
        class="btn btn-secondary"
        @click="showCustomInput = !showCustomInput"
      >
        {{ showCustomInput ? '隐藏输入' : '输入消息' }}
      </button>

      <button
        v-if="gameState.isPlaying"
        class="btn btn-warning"
        :disabled="!canUndo"
        @click="$emit('undo')"
      >
        悔棋
      </button>

      <button
        v-if="gameState.isPlaying"
        class="btn btn-danger"
        @click="$emit('surrender')"
      >
        认输
      </button>

      <button
        v-if="gameState.gameMode !== 'online' && !gameState.isPlaying"
        class="btn btn-success"
        @click="$emit('play-again')"
      >
        再来一局
      </button>

      <button
        class="btn btn-secondary"
        @click="$emit('toggle-numbers')"
      >
        {{ showMoveNumbers ? '隐藏序号' : '序号' }}
      </button>

      <button
        v-if="!gameState.isPlaying && gameState.moveHistory.length > 0"
        class="btn btn-primary"
        @click="$emit('export-game')"
      >
        导出
      </button>

      <button
        class="btn btn-primary"
        @click="$emit('exit-room')"
      >
        {{ gameState.gameMode === 'online' ? '退出' : '菜单' }}
      </button>
    </div>
  </div>

  <div
    v-if="showEmojiPopup && gameState.gameMode === 'online'"
    class="emoji-popup"
  >
    <div class="emoji-grid">
      <button
        v-for="(emoji, index) in emojis"
        :key="index"
        class="emoji-item"
        @click="$emit('send-emoji', emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { GameState } from '@/types/game';

interface Props {
  gameState: GameState;
  showMoveNumbers: boolean;
  showEmojiPopup: boolean;
  isReady?: boolean;
}

interface Emits {
  (e: 'ready'): void;
  (e: 'undo'): void;
  (e: 'surrender'): void;
  (e: 'play-again'): void;
  (e: 'toggle-numbers'): void;
  (e: 'export-game'): void;
  (e: 'exit-room'): void;
  (e: 'quick-msg', message: string): void;
  (e: 'toggle-emoji'): void;
  (e: 'send-emoji', emoji: string): void;
  (e: 'send-custom', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const emojis = [
  '😊', '👍', '👏', '🤔', '😅', '😎',
  '🎉', '💪', '🙏', '😤', '😱', '💀'
];

const showCustomInput = ref(false);
const customMessage = ref('');

const handleClickOutside = (event: MouseEvent) => {
  if (!props.showEmojiPopup) return; // 如果弹框未显示，不处理
  const target = event.target as HTMLElement;
  // 检查点击是否在表情按钮或弹框外部
  const isClickingEmojiBtn = target.closest('.emoji-btn');
  const isClickingPopup = target.closest('.emoji-popup');
  if (!isClickingEmojiBtn && !isClickingPopup) {
    emit('toggle-emoji');
  }
};

function sendCustomMessage() {
  const message = customMessage.value.trim();
  if (message) {
    emit('send-custom', message);
    customMessage.value = '';
    showCustomInput.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const canUndo = computed(() => {
  const currentPlayer = props.gameState.currentPlayer;
  const myColor = props.gameState.myColor;
  const isMyTurn = currentPlayer === myColor;

  if (props.gameState.gameMode === 'local') {
    return props.gameState.players[currentPlayer].undoLeft > 0 &&
           props.gameState.moveHistory.length > 0;
  }

  if (props.gameState.gameMode === 'ai') {
    return props.gameState.moveHistory.length >= 2;
  }

  if (props.gameState.gameMode === 'online') {
    return isMyTurn &&
           props.gameState.players[myColor].undoLeft > 0 &&
           props.gameState.moveHistory.length > 0;
  }

  return false;
});
</script>

<style scoped>
.controls {
  flex-shrink: 0;
  padding: 4px 0;
}

.btn-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
}

.btn-success {
  background: #2ecc71;
  color: #fff;
}

.btn-warning {
  background: #f39c12;
  color: #fff;
}

.btn-secondary {
  background: #95a5a6;
  color: #fff;
}

.btn-send {
  background: #2ecc71;
  color: #fff;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-close {
  background: #e74c3c;
  color: #fff;
  padding: 6px 10px;
  font-size: 14px;
  border-radius: 6px;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 4px 0;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  height: 12vh;
  max-height: 120px;
  overflow-y: auto;
  min-height: 80px;
}

.chat-message {
  display: flex;
  align-items: center;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  max-width: 80%;
  line-height: 1.4;
}

.message-me {
  align-self: flex-end;
  background: rgba(52, 152, 219, 0.4);
}

.message-opponent {
  align-self: flex-start;
  background: rgba(46, 204, 113, 0.4);
}

.message-text {
  color: #fff;
  word-break: break-all;
}

.message-emoji {
  font-size: 14px;
}

.chat-bar {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.chat-bar .quick-msg {
  padding: 4px 10px;
  background: rgba(52, 152, 219, 0.3);
  border: none;
  border-radius: 15px;
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-bar .quick-msg:hover {
  background: rgba(52, 152, 219, 0.5);
}

.chat-bar .emoji-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-bar .emoji-btn:hover {
  transform: scale(1.2);
}

.custom-input-container {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  align-items: center;
}

.custom-input {
  flex: 1;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 12px;
}

.custom-input::placeholder {
  color: #888;
}

.custom-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
}

.emoji-popup {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  padding: 10px;
  border-radius: 12px;
  display: grid;
  z-index: 1500;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.emoji-popup .emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.emoji-popup .emoji-item {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-popup .emoji-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* 移动端优化 */
@media (max-width: 767px) {
  .chat-messages {
    height: 15vh;
    min-height: 80px;
    max-height: 100px;
  }

  .chat-message {
    font-size: 10px;
    padding: 2px 6px;
  }

  .btn {
    padding: 5px 10px;
    font-size: 11px;
  }

  .btn-row {
    gap: 4px;
  }

  .chat-bar {
    padding: 3px 6px;
    gap: 4px;
  }

  .chat-bar .quick-msg {
    padding: 3px 8px;
    font-size: 10px;
  }

  .emoji-popup {
    bottom: 100px;
  }

  .emoji-popup .emoji-item {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }

  .custom-input-container {
    padding: 3px 6px;
  }

  .custom-input {
    font-size: 11px;
    padding: 4px 8px;
  }
}

@media (min-width: 768px) {
  .btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  .btn-row {
    gap: 8px;
  }
  .chat-bar {
    gap: 8px;
    padding: 6px 10px;
  }
  .chat-bar .quick-msg {
    padding: 6px 12px;
    font-size: 12px;
  }

  .chat-messages {
    height: 12vh;
    max-height: 150px;
    min-height: 100px;
  }
}
</style>
