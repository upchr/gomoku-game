<template>
  <div class="history-panel" :class="{ 'active': visible }">
    <div class="history-content">
      <div class="history-body">
        <h3>📋 对局记录</h3>
        <div id="historyList">
          <div v-if="history.length === 0" style="text-align: center; color: #888;">
            暂无对局记录
          </div>
          <div
            v-for="(game, index) in history"
            :key="index"
            class="room-item"
          >
            <div>
              <div>{{ game.player1 }} vs {{ game.player2 }}</div>
              <div style="font-size: 11px; color: #888;">{{ game.date }}</div>
            </div>
            <div style="color: #2ecc71; font-weight: 600; font-size: 12px;">
              {{ game.winner }} {{ game.winner !== '平局' ? '胜' : '' }}
            </div>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="menu-btn warning" @click="clearHistory">
          清空记录
        </button>
        <button class="menu-btn secondary" @click="close">
          返回菜单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GameHistory } from '@/types/game';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'show-toast', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 对局记录
const history = ref<GameHistory[]>([]);

// 加载对局记录
const loadHistory = () => {
  try {
    const stored = localStorage.getItem('gomoku_history');
    if (stored) {
      history.value = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load game history:', error);
  }
};

// 清空对局记录
const clearHistory = () => {
  if (confirm('确定要清空所有对局记录吗？此操作不可恢复。')) {
    try {
      localStorage.removeItem('gomoku_history');
      history.value = [];
      emit('show-toast', '对局记录已清空');
    } catch (error) {
      console.error('Failed to clear game history:', error);
    }
  }
};

// 关闭面板
const close = () => {
  emit('close');
};

// 组件挂载时加载记录
loadHistory();
</script>

<style scoped>
.history-panel {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 150;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.history-panel.active {
  display: flex;
}

.history-content {
  background: #2c3e50;
  padding: 30px;
  border-radius: 15px;
  max-width: 450px;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.history-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.history-body h3 {
  margin-bottom: 15px;
  text-align: center;
  color: #3498db;
}

.room-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-btn {
  display: block;
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.menu-btn.warning {
  background: linear-gradient(135deg, #f39c12, #d68910);
  color: #fff;
}

.menu-btn.secondary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
}

.menu-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>