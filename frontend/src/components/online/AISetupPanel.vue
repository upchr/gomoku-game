<template>
  <div class="modal-panel" v-if="visible">
    <div class="modal-content">
      <h2>🤖 人机对战设置</h2>
      <div class="form-group">
        <label>你的昵称</label>
        <input
          type="text"
          v-model="playerName"
          placeholder="输入昵称"
          maxlength="10"
        />
      </div>
      <div class="form-group">
        <label>执子颜色</label>
        <select v-model="playerColor">
          <option :value="1">⚫ 黑子（先手）</option>
          <option :value="2">⚪ 白子（后手）</option>
        </select>
      </div>
      <div class="form-group">
        <label>AI 难度</label>
        <select v-model="difficulty">
          <option value="easy">简单（快速）</option>
          <option value="medium">中等（均衡）</option>
          <option value="hard">困难（强力）</option>
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
        <label>对局时长</label>
        <select v-model="gameTime">
          <option :value="0">不限时</option>
          <option :value="180">3分钟</option>
          <option :value="300">5分钟</option>
          <option :value="600">10分钟</option>
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
import type { Difficulty } from '@/types/game'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'start', config: AIGameConfig): void
}

const emit = defineEmits<Emits>()

interface AIGameConfig {
  playerName: string
  playerColor: 1 | 2
  difficulty: Difficulty
  size: number
  time: number
}

const playerName = ref('玩家')
const playerColor = ref<1 | 2>(1)
const difficulty = ref<Difficulty>('medium')
const boardSize = ref(15)
const gameTime = ref(300)

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
  const config: AIGameConfig = {
    playerName: validateNickname(playerName.value) || '玩家',
    playerColor: playerColor.value,
    difficulty: difficulty.value,
    size: boardSize.value,
    time: gameTime.value
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