<template>
  <div class="rules-panel" :class="{ 'active': visible }">
    <div class="rules-content">
      <div class="rules-body">
        <h2>📖 五子棋规则</h2>

        <h3>🎯 游戏目标</h3>
        <p>先将五颗棋子连成一线（横、竖、斜均可）者获胜。</p>

        <h3>⚫ 基本规则</h3>
        <ul>
          <li>黑方先行，双方轮流落子</li>
          <li>棋子落在网格线的交点上</li>
          <li>棋子落定后不可移动</li>
          <li>先连成五子者获胜</li>
        </ul>

        <h3>⏱️ 计时规则</h3>
        <ul>
          <li>每方有独立计时，超时判负</li>
          <li>可选择 3/5/10 分钟或不限时</li>
          <li>轮到谁落子，谁的计时器走动</li>
        </ul>

        <h3>🔄 悔棋规则</h3>
        <ul>
          <li>本地对战：直接悔棋</li>
          <li>在线对战：需对方同意</li>
          <li>悔棋次数有限，用完则无法悔棋</li>
        </ul>

        <h3>🏆 比赛模式</h3>
        <ul>
          <li>单局决胜：一局定胜负</li>
          <li>三局两胜：先赢两局者获胜</li>
          <li>五局三胜：先赢三局者获胜</li>
        </ul>

        <h3>💡 游戏技巧</h3>
        <ul>
          <li>注意防守：阻止对方连成五子</li>
          <li>双三必胜：同时形成两个活三</li>
          <li>冲四活三：形成冲四的同时有活三</li>
          <li>抢占天元：开局占据中心位置</li>
        </ul>
      </div>
      <button class="menu-btn primary close-btn" @click="close">
        知道了
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const close = () => {
  emit('close');
};
</script>

<style scoped>
.rules-panel {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 200;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.rules-panel.active {
  display: flex;
}

.rules-content {
  background: #2c3e50;
  padding: 30px;
  border-radius: 15px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.rules-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.rules-body h2 {
  margin-bottom: 20px;
  text-align: center;
  color: #3498db;
}

.rules-body h3 {
  margin: 15px 0 10px;
  color: #2ecc71;
  font-size: 16px;
}

.rules-body p,
.rules-body li {
  color: #ccc;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.rules-body ul {
  padding-left: 20px;
}

.rules-content .close-btn {
  margin-top: 20px;
  width: 100%;
  flex-shrink: 0;
}

.menu-btn {
  display: block;
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.menu-btn.primary {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
}

.menu-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>