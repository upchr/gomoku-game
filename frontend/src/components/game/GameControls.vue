<template>
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
import { computed, onMounted, onUnmounted } from 'vue';
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
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const emojis = [
  '😊', '👍', '👏', '🤔', '😅', '😎',
  '🎉', '💪', '🙏', '😤', '😱', '💀'
];

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.emoji-btn') && !target.closest('.emoji-popup')) {
    emit('toggle-emoji');
  }
};

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

.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.chat-bar {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;
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

.emoji-popup {
  position: fixed;
  bottom: 80px;
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
}
</style>
