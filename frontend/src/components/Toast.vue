<template>
  <transition name="toast">
    <div v-if="visible" class="message-toast">
      {{ message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  message: string;
  visible: boolean;
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 2500
});

let timeout: number | null = null;

// 监听 visible 变化，自动隐藏
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      // 触发关闭事件（由父组件处理）
      // 这里我们只负责定时，实际关闭由父组件控制
    }, props.duration);
  }
});
</script>

<style scoped>
.message-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.95), rgba(41, 128, 185, 0.95));
  color: #fff;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  z-index: 9999;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 80%;
  word-break: break-word;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

.toast-enter-to {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.05);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}

@media (max-width: 600px) {
  .message-toast {
    font-size: 14px;
    padding: 12px 24px;
  }
}
</style>