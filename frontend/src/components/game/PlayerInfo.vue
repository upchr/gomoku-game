<template>
  <div class="player-info" :class="{ me: isMe }">
    <div class="name">
      <span class="color-icon">{{ colorIcon }}</span>
      <span>{{ player.name }}</span>
    </div>
    <div class="time">{{ formatTime(player.time) }}</div>
    <div class="moves">落子: {{ player.moves }}</div>
    <div class="undo-count">悔棋: {{ player.undoLeft }}次</div>
    <div v-if="isCurrentTurn" class="turn-indicator">⏰ 当前回合</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerInfo as PlayerInfoType } from '@/types/game';

const props = defineProps<{
  player: PlayerInfoType;
  color: 1 | 2;
  isMe?: boolean;
  isCurrentTurn?: boolean;
}>();

const colorIcon = computed(() => props.color === 1 ? '⚫' : '⚪');

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
</script>

<style scoped>
.player-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 18px;
  border-radius: 12px;
  margin-bottom: 15px;
  min-width: 200px;
  transition: all 0.3s;
}

.player-info.me {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid #3498db;
}

.name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.color-icon {
  font-size: 20px;
}

.time,
.moves,
.undo-count {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 4px;
}

.turn-indicator {
  margin-top: 8px;
  color: #f39c12;
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
