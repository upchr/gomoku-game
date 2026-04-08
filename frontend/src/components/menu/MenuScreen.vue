<template>
  <div class="menu-screen">
    <div class="menu-content">
      <h1 class="menu-title">🎮 五子棋</h1>
      <p class="menu-subtitle">在线对战平台</p>
      
      <button class="menu-btn primary" @click="$emit('start-local')">
        🤝 本地对战
      </button>
      
      <button class="menu-btn secondary" @click="$emit('start-ai')">
        🤖 人机对战
      </button>
      
      <button class="menu-btn tertiary" @click="$emit('start-online')">
        🌐 在线对战
      </button>
      
      <button class="menu-btn warning" @click="$emit('show-history')">
        📜 历史记录
      </button>
      
      <button class="menu-btn warning" @click="$emit('show-rules')">
        📖 游戏规则
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件只负责显示菜单，事件由父组件处理
defineEmits<{
  'start-local': [];
  'start-ai': [];
  'start-online': [];
  'show-history': [];
  'show-rules': [];
}>();
</script>

<style scoped>
.menu-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.menu-content {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.menu-title {
  font-size: 2.2em;
  margin-bottom: 8px;
}

.menu-subtitle {
  color: #aaa;
  margin-bottom: 30px;
  font-size: 14px;
}

.menu-btn {
  display: block;
  width: 100%;
  padding: 15px;
  margin-bottom: 12px;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.menu-btn.primary {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
}

.menu-btn.secondary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
}

.menu-btn.tertiary {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff;
}

.menu-btn.warning {
  background: linear-gradient(135deg, #f39c12, #d68910);
  color: #fff;
}

.menu-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}
</style>
