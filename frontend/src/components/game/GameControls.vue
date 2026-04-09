<template>
  <div class="controls">
    <!-- 准备按钮（仅在线模式） -->
    <button
      v-if="gameState.gameMode === 'online' && !gameState.isPlaying"
      class="btn btn-success"
      :disabled="gameState.matchEnded"
      @click="$emit('ready')"
    >
      准备
    </button>

    <!-- 悔棋按钮 -->
    <button
      v-if="gameState.isPlaying"
      class="btn btn-warning"
      :disabled="!canUndo"
      @click="$emit('undo')"
    >
      悔棋
    </button>

    <!-- 认输按钮 -->
    <button
      v-if="gameState.isPlaying"
      class="btn btn-danger"
      @click="$emit('surrender')"
    >
      认输
    </button>

    <!-- 再来一局按钮 -->
    <button
      v-if="gameState.gameMode !== 'online' || gameState.isPlaying || (!gameState.isPlaying && !gameState.matchEnded)"
      class="btn btn-success"
      :disabled="gameState.isPlaying && gameState.gameMode === 'online'"
      @click="$emit('play-again')"
    >
      {{ gameState.isPlaying && gameState.gameMode === 'online' ? '进行中' : '再来一局' }}
    </button>

    <!-- 显示/隐藏序号按钮 -->
    <button
      class="btn btn-secondary"
      @click="$emit('toggle-numbers')"
    >
      {{ showMoveNumbers ? '隐藏序号' : '显示序号' }}
    </button>

    <!-- 导出棋谱按钮 -->
    <button
      v-if="!gameState.isPlaying && gameState.moveHistory.length > 0"
      class="btn btn-primary"
      @click="$emit('export-game')"
    >
      导出棋谱
    </button>

    <!-- 退出房间按钮 -->
    <button
      class="btn btn-primary"
      @click="$emit('exit-room')"
    >
      {{ gameState.gameMode === 'online' ? '退出房间' : '返回菜单' }}
    </button>
  </div>

  <!-- 快捷消息和表情栏（仅在线模式） -->
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

  <!-- 表情弹窗 -->
  <div
    v-if="showEmojiPopup"
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

// 表情列表
const emojis = [
  '😊', '👍', '👏', '🤔', '😅', '😎',
  '🎉', '💪', '🙏', '😤', '😱', '💀'
];

// 点击外部关闭表情弹窗
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

// 是否可以悔棋
const canUndo = computed(() => {
  const currentPlayer = props.gameState.currentPlayer;
  const myColor = props.gameState.myColor;
  const isMyTurn = currentPlayer === myColor;

  // 本地模式：始终可以悔棋（如果有剩余次数）
  if (props.gameState.gameMode === 'local') {
    return props.gameState.players[currentPlayer].undoLeft > 0 &&
           props.gameState.moveHistory.length > 0;
  }

  // AI 模式：始终可以悔棋（无限次数）
  if (props.gameState.gameMode === 'ai') {
    return props.gameState.moveHistory.length >= 2;
  }

  // 在线模式：轮到我时才能请求悔棋
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
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
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

/* 快捷消息和表情栏 */
.chat-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.chat-bar .quick-msg {
  padding: 6px 12px;
  background: rgba(52, 152, 219, 0.3);
  border: none;
  border-radius: 15px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-bar .quick-msg:hover {
  background: rgba(52, 152, 219, 0.5);
}

.chat-bar .emoji-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-bar .emoji-btn:hover {
  transform: scale(1.2);
}

/* 表情弹窗 */
.emoji-popup {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  padding: 15px;
  border-radius: 12px;
  display: grid;
  z-index: 1500;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.emoji-popup .emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.emoji-popup .emoji-item {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-popup .emoji-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

@media (max-width: 600px) {
  .btn {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>