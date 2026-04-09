<template>
  <div class="modal-panel" v-if="visible">
    <div class="modal-content">
      <h2>🔒 输入房间密码</h2>
      <p style="text-align: center; margin-bottom: 15px; color: #aaa;">
        房间 <span style="color: #3498db; font-weight: 600;">{{ roomCode }}</span> 需要密码
      </p>
      <div class="form-group">
        <input
          type="password"
          v-model="password"
          placeholder="输入密码"
          @keyup.enter="submit"
        />
      </div>
      <div class="button-group">
        <button class="btn btn-success" style="flex:1" @click="submit">
          加入
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
  roomCode: string
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', password: string): void
}

const emit = defineEmits<Emits>()

const password = ref('')

function submit() {
  if (!password.value) {
    alert('请输入密码')
    return
  }
  emit('submit', password.value)
  emit('update:visible', false)
  password.value = ''
}

function cancel() {
  emit('update:visible', false)
  password.value = ''
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

.btn-danger {
  background: #e74c3c;
  color: #fff;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>