<template>
  <div class="player-info" :class="{ me: isMe, active: isCurrentTurn }">
    <div class="name">
      <span class="color-icon">{{ colorIcon }}</span>
      <span class="name-text">{{ displayName }}</span>
      <span v-if="isAIThinking" class="ai-thinking">🤔</span>
    </div>
    <div class="stats">
      <span class="time" :class="{ 'time-warning': player.time <= 30 && player.time > 0, 'time-danger': player.time <= 10 }">{{ formatTime(player.time) }}</span>
      <span class="moves">{{ player.moves }}手</span>
      <span class="undo-count">悔{{ player.undoLeft }}</span>
    </div>
    <div v-if="isCurrentTurn && !isAIThinking" class="turn-indicator">思考中</div>
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
  isAIThinking?: boolean;
}>();

const colorIcon = computed(() => props.color === 1 ? '⚫' : '⚪');

const displayName = computed(() => {
  if (props.isAIThinking) {
    return props.player.name;
  }
  return props.player.name;
});

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
</script>

<style scoped>
.player-info {
  background: rgba(255, 255, 255, 0.08);
  padding: 8px 16px;
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0 6px;
}

.player-info.me {
  background: rgba(52, 152, 219, 0.15);
  border: 1.5px solid rgba(52, 152, 219, 0.5);
}

.player-info.active {
  background: rgba(243, 156, 18, 0.12);
  border: 1.5px solid rgba(243, 156, 18, 0.4);
}

.name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.color-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-thinking {
  font-size: 14px;
  margin-left: 4px;
  animation: thinking 1.5s ease-in-out infinite;
}

@keyframes thinking {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #aaa;
  flex-shrink: 0;
}

.time {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #eee;
  min-width: 42px;
  text-align: center;
}

.time-warning {
  color: #f39c12;
}

.time-danger {
  color: #e74c3c;
  animation: pulse 1s infinite;
}

.moves, .undo-count {
  color: #999;
}

.turn-indicator {
  color: #f39c12;
  font-size: 11px;
  font-weight: 600;
  animation: pulse 1.5s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 移动端优化 */
@media (max-width: 767px) {
  .player-info {
    padding: 8px 14px;
    margin: 1vh 8px;
  }

  .name {
    font-size: 13px;
  }

  .color-icon {
    font-size: 13px;
  }

  .stats {
    font-size: 11px;
    gap: 6px;
  }

  .time {
    font-size: 11px;
    min-width: 38px;
  }

  .turn-indicator {
    font-size: 10px;
  }
}

@media (min-width: 768px) {
  .player-info {
    padding: 10px 18px;
    gap: 14px;
    margin: 3vh 8px;
  }

  .name {
    font-size: 16px;
  }

  .color-icon {
    font-size: 16px;
  }

  .stats {
    font-size: 13px;
    gap: 10px;
  }
}
</style>
