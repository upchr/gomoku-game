<template>
  <div class="modal-panel" v-if="visible">
    <div class="modal-content">
      <h2>🌐 在线对战</h2>
      <div class="form-group">
        <label>你的昵称</label>
        <input
          type="text"
          v-model="nickname"
          placeholder="输入昵称"
          maxlength="10"
        />
      </div>
      <div class="button-group" style="margin-bottom: 15px;">
        <button class="btn btn-primary" style="flex:1" @click="createRoom">
          创建房间
        </button>
        <button class="btn btn-success" style="flex:1" @click="refreshRoomList">
          房间列表
        </button>
      </div>
      <div v-if="showRoomList" id="roomListContainer">
        <h4 style="margin-bottom: 8px; color: #fff;">可用房间</h4>
        <div class="room-list">
          <p v-if="loading" style="text-align: center; color: #888;">加载中...</p>
          <p v-else-if="rooms.length === 0" style="text-align: center; color: #888;">暂无可用房间</p>
          <div
            v-else
            v-for="room in rooms"
            :key="room.code"
            class="room-item"
            @click="selectRoom(room.code, room.hasPassword)"
          >
            <div>
              <div class="code">{{ room.code }}</div>
              <div class="host">房主: {{ room.hostName }} | {{ room.matchMode === 1 ? '单局' : room.matchMode + '局' }}</div>
            </div>
            <div class="status" :class="room.hasPassword ? 'locked' : 'waiting'">
              {{ room.hasPassword ? '🔒' : '🟢' }}
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>手动输入房间码</label>
          <input
            type="text"
            v-model="manualRoomCode"
            placeholder="6位房间码"
            maxlength="6"
            style="text-transform: uppercase;"
          />
        </div>
        <button class="btn btn-success" style="width:100%" @click="joinRoomByCode">
          加入房间
        </button>
      </div>
      <button class="btn btn-danger" style="width:100%; margin-top: 12px;" @click="cancel">
        返回
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Room } from '@/types/game'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'create-room', config: CreateRoomConfig): void
  (e: 'refresh-room-list'): void
  (e: 'join-room', data: JoinRoomData): void
  (e: 'join-room-by-code', data: JoinRoomByCodeData): void
}

const emit = defineEmits<Emits>()

interface CreateRoomConfig {
  nickname: string
}

interface JoinRoomData {
  roomCode: string
  hasPassword: boolean
  nickname: string
}

interface JoinRoomByCodeData {
  roomCode: string
  nickname: string
}

const nickname = ref('')
const showRoomList = ref(false)
const loading = ref(false)
const rooms = ref<Room[]>([])
const manualRoomCode = ref('')

function validateNickname(name: string): string {
  if (!name) return '玩家'
  const trimmed = name.trim()
  if (trimmed.length > 20) {
    return trimmed.substring(0, 20)
  }
  const filtered = trimmed.replace(/[<>"'&]/g, '')
  return filtered || '玩家'
}

function createRoom() {
  emit('create-room', {
    nickname: validateNickname(nickname.value) || '玩家'
  })
}

function refreshRoomList() {
  showRoomList.value = true
  loading.value = true
  rooms.value = []
  emit('refresh-room-list')
}

function selectRoom(code: string, hasPassword: boolean) {
  emit('join-room', {
    roomCode: code,
    hasPassword,
    nickname: validateNickname(nickname.value) || '玩家'
  })
}

function joinRoomByCode() {
  const code = manualRoomCode.value.toUpperCase().trim()
  if (code.length !== 6) {
    alert('请输入6位房间码')
    return
  }
  emit('join-room-by-code', {
    roomCode: code,
    nickname: validateNickname(nickname.value) || '玩家'
  })
}

// 暴露方法给父组件
defineExpose({
  updateRoomList(roomList: Room[]) {
    rooms.value = roomList
    loading.value = false
  }
})

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

.modal-content h4 {
  color: #fff;
  margin-bottom: 8px;
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

.form-group input {
  width: 100%;
  padding: 10px;
  border: 2px solid #34495e;
  border-radius: 6px;
  background: #34495e;
  color: #fff;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.room-list {
  max-height: 280px;
  overflow-y: auto;
  margin: 15px 0;
}

.room-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.room-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.room-item .code {
  font-size: 16px;
  font-weight: 600;
  color: #3498db;
}

.room-item .host {
  font-size: 12px;
  color: #aaa;
}

.room-item .status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.room-item .status.waiting {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.room-item .status.locked {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
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

.btn-success {
  background: #2ecc71;
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