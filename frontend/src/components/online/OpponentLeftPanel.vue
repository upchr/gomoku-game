<template>
  <div class="modal-panel" v-if="visible">
    <div class="modal-content">
      <h2>👋 对手已离开房间</h2>
      <div class="room-code-display">{{ roomCode }}</div>
      <div
        v-if="password"
        id="roomPasswordHint"
        style="text-align: center; color: #f39c12;"
      >
        🔒 密码: {{ password }}
      </div>
      <p style="text-align: center; color: #aaa; margin-top: 15px; font-size: 13px;">
        游戏已重置，等待新对手加入...
      </p>
      <p style="text-align: center; color: #aaa; margin-top: 15px; font-size: 13px;">
        分享房间码给好友<span class="waiting-dots"><span>.</span><span>.</span><span>.</span></span>
      </p>
      <div class="button-row">
        <button class="btn btn-primary" @click="copyLink">
          📋 复制链接
        </button>
        <button class="btn btn-danger" @click="cancel">
          取消
        </button>
      </div>
      <p v-if="copySuccess" class="copy-success">
        ✓ 链接已复制到剪贴板
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

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
const copySuccess = ref(false)

function getRoomUrl(): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const url = new URL(baseUrl);
  url.searchParams.set('room', props.roomCode);
  if (props.password) {
    url.searchParams.set('pwd', props.password);
  }
  return url.toString();
}

async function copyLink() {
  const url = getRoomUrl();

  try {
    // 方案 A: 现代 API (HTTPS 环境)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
      }, 2000);
      return;
    }

    // 方案 B: 降级方案（创建临时 textarea）
    const textArea = document.createElement('textarea');
    textArea.value = url;

    // 避免滚动跳动和视觉闪烁
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (success) {
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
      }, 2000);
    } else {
      console.error('复制失败: execCommand 返回 false');
    }
  } catch (error) {
    console.error('复制失败:', error);
  }
}

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

.btn-primary {
  background: #3498db;
  color: #fff;
}

.button-row {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.button-row .btn {
  flex: 1;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.copy-success {
  text-align: center;
  color: #2ecc71;
  font-size: 12px;
  margin-top: 10px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>