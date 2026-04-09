<template>
  <div class="modal-panel" v-if="visible">
    <div class="modal-content">
      <h2>⏳ 等待对手加入</h2>
      <div class="room-code-display">{{ roomCode }}</div>
      <div
        v-if="password"
        id="roomPasswordHint"
        style="text-align: center; color: #f39c12;"
      >
        🔒 密码: {{ password }}
      </div>
      <p style="text-align: center; color: #aaa; margin-top: 15px; font-size: 13px;">
        分享房间码给好友
      </p>
      <p style="text-align: center; color: #aaa; margin-top: 15px; font-size: 13px;">
        等待对手加入<span class="waiting-dots"><span>.</span><span>.</span><span>.</span></span>
      </p>
      <button class="btn btn-danger" style="width:100%; margin-top: 15px;" @click="cancel">
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  roomCode: string
  password?: string
}

const props = withDefaults(defineProps<Props>(), {
  password: ''
})

interface Emits {
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

function cancel() {
  emit('cancel')
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
  text-align: center;
}

.modal-content h2 {
  margin-bottom: 15px;
  text-align: center;
  font-size: 1.3em;
  color: #fff;
}

.room-code-display {
  font-size: 32px;
  font-family: 'Courier New', monospace;
  letter-spacing: 6px;
  color: #2ecc71;
  margin: 8px 0;
  text-align: center;
}

.waiting-dots span {
  animation: blink 1.4s infinite;
}

.waiting-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.waiting-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 80%, 100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
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