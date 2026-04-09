<template>
  <div class="modal-panel" v-if="visible">
    <div class="modal-content">
      <h2>🎮 本地对战设置</h2>
      <div class="form-group">
        <label>黑方名称</label>
        <input
          type="text"
          v-model="player1"
          placeholder="玩家1"
          maxlength="10"
        />
      </div>
      <div class="form-group">
        <label>白方名称</label>
        <input
          type="text"
          v-model="player2"
          placeholder="玩家2"
          maxlength="10"
        />
      </div>
      <div class="form-group">
        <label>对局时长</label>
        <select v-model="gameTime">
          <option :value="0">不限时</option>
          <option :value="180">3分钟</option>
          <option :value="300">5分钟</option>
          <option :value="600">10分钟</option>
        </select>
      </div>
      <div class="form-group">
        <label>棋盘大小</label>
        <select v-model="boardSize">
          <option :value="13">13×13</option>
          <option :value="15">15×15</option>
          <option :value="19">19×19</option>
        </select>
      </div>
      <div class="form-group">
        <label>悔棋次数</label>
        <select v-model="undoLimit">
          <option :value="1">1次</option>
          <option :value="3">3次</option>
          <option :value="5">5次</option>
          <option :value="999">无限</option>
        </select>
      </div>
      <div class="button-group">
        <button class="btn btn-primary" style="flex:1" @click="startGame">
          开始游戏
        </button>
        <button class="btn btn-danger" @click="cancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'start', config: LocalGameConfig): void
}

const emit = defineEmits<Emits>()

interface LocalGameConfig {
  player1: string
  player2: string
  time: number
  size: number
  undoLimit: number
}

const player1 = ref('玩家1')
const player2 = ref('玩家2')
const gameTime = ref(300)
const boardSize = ref(15)
const undoLimit = ref(3)

function validateNickname(name: string): string {
  if (!name) return '玩家'
  const trimmed = name.trim()
  if (trimmed.length > 20) {
    return trimmed.substring(0, 20)
  }
  const filtered = trimmed.replace(/[<>"'&]/g, '')
  return filtered || '玩家'
}

function startGame() {
  const config: LocalGameConfig = {
    player1: validateNickname(player1.value) || '玩家1',
    player2: validateNickname(player2.value) || '玩家2',
    time: gameTime.value,
    size: boardSize.value,
    undoLimit: undoLimit.value
  }
  emit('start', config)
  emit('update:visible', false)
}

function cancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.modal-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-content {
  background: #2c3e50;
  padding: 25px;
  border-radius: 12px;
  max-width: 450px;
  width: 100%;
}

.modal-content h2 {
  margin-bottom: 15px;
  text-align: center;
  font-size: 1.3em;
  color: #fff;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #aaa;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 2px solid #34495e;
  border-radius: 6px;
  background: #34495e;
  color: #fff;
  font-size: 14px;
}

.form-group select {
  cursor: pointer;
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

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>