<template>
  <div class="undo-request-modal" v-if="visible">
    <div class="undo-request-content">
      <h3>🔄 悔棋请求</h3>
      <p>{{ requestText }}</p>
      <div class="button-group">
        <button class="btn btn-success" @click="onAccept">同意</button>
        <button class="btn btn-danger" @click="onReject">拒绝</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  requestText?: string
}

const props = withDefaults(defineProps<Props>(), {
  requestText: '对手请求悔棋，是否同意？'
})

interface Emits {
  (e: 'accept'): void
  (e: 'reject'): void
}

const emit = defineEmits<Emits>()

function onAccept() {
  emit('accept')
}

function onReject() {
  emit('reject')
}
</script>

<style scoped>
.undo-request-modal {
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

.undo-request-content {
  background: #2c3e50;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  max-width: 350px;
  width: 90%;
}

.undo-request-content h3 {
  margin-bottom: 12px;
  color: #fff;
  font-size: 1.2em;
}

.undo-request-content p {
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