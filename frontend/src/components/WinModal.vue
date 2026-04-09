<template>
  <div class="win-modal" v-if="visible">
    <div class="win-content">
      <h2>🎉 游戏结束</h2>
      <div class="winner-name" :style="{ color: winnerColor }">
        {{ winnerText }}
      </div>
      <div style="margin-bottom: 15px; color: #aaa; font-size: 13px;">
        {{ matchResult }}
      </div>
      <div
        v-if="showReadyStatus"
        style="margin-bottom: 10px; color: #3498db; font-size: 12px;"
        :style="{ color: readyStatusColor }"
      >
        {{ readyStatus }}
      </div>
      <div class="button-group">
        <button
          class="btn btn-success"
          style="flex:1"
          :disabled="readyDisabled"
          @click="onReady"
        >
          {{ readyButtonText }}
        </button>
        <button class="btn btn-primary" style="flex:1" @click="onClose">
          查看棋谱
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  winnerName?: string
  matchResult?: string
  readyStatus?: string
  readyStatusColor?: string
  readyDisabled?: boolean
  readyButtonText?: string
  showReadyStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  winnerName: '',
  matchResult: '',
  readyStatus: '等待双方准备...',
  readyStatusColor: '#3498db',
  readyDisabled: false,
  readyButtonText: '准备',
  showReadyStatus: true
})

interface Emits {
  (e: 'ready'): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 从winnerName解析结果
const winnerText = computed(() => {
  return props.winnerName || '游戏结束'
})

const winnerColor = computed(() => {
  // 根据winnerName判断颜色
  if (props.winnerName?.includes('平局')) return '#f39c12'
  if (props.winnerName?.includes('黑方')) return '#2ecc71'
  if (props.winnerName?.includes('白方')) return '#2ecc71'
  return '#2ecc71'
})

function onReady() {
  emit('ready')
}

function onClose() {
  emit('close')
}
</script>

<style scoped>
.win-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.win-content {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.win-content h2 {
  margin-bottom: 15px;
  font-size: 1.3em;
  color: #fff;
}

.win-content .winner-name {
  font-size: 24px;
  margin: 15px 0;
  font-weight: bold;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.btn-success {
  background: #2ecc71;
  color: #fff;
}

.btn-primary {
  background: #3498db;
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
</style>