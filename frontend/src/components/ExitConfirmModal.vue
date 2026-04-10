<template>
  <div class="exit-confirm-modal" v-if="visible">
    <div class="exit-confirm-content">
      <h3>🚪 确认退出</h3>
      <p>{{ message }}</p>
      <div class="button-group">
        <button class="btn btn-primary" @click="onConfirm">确认退出</button>
        <button class="btn btn-secondary" @click="onCancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: '确定要退出吗？当前对局将无法继续。'
})

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
}
</script>

<style scoped>
.exit-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.exit-confirm-content {
  background: #2c3e50;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  max-width: 350px;
  width: 90%;
}

.exit-confirm-content h3 {
  margin-bottom: 12px;
  color: #fff;
  font-size: 1.2em;
}

.exit-confirm-content p {
  color: #aaa;
  margin-bottom: 15px;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
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

.btn-secondary {
  background: #95a5a6;
  color: #fff;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>