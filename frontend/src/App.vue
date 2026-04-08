<template>
  <div id="app">
    <!-- 主菜单 -->
    <MenuScreen
      v-if="showMenu"
      @start-local="startLocalGame"
      @start-ai="startAIGame"
      @start-online="startOnlineGame"
      @show-history="showHistory = true"
      @show-rules="showRules = true"
    />
    
    <!-- 游戏界面 -->
    <div v-if="showGame" class="game-screen">
      <!-- 对手信息 -->
      <PlayerInfo
        :player="gameStore.players[opponentColor]"
        :color="opponentColor"
        :is-me="false"
        :is-current-turn="gameStore.currentPlayer === opponentColor"
      />
      
      <!-- 棋盘 -->
      <GameBoard />
      
      <!-- 我方信息 -->
      <PlayerInfo
        :player="gameStore.players[gameStore.myColor]"
        :color="gameStore.myColor"
        :is-me="true"
        :is-current-turn="gameStore.currentPlayer === gameStore.myColor"
      />
      
      <!-- 控制按钮 -->
      <div class="controls">
        <button class="btn btn-warning" @click="undo" :disabled="!canUndo">悔棋</button>
        <button class="btn btn-danger" @click="surrender">认输</button>
        <button class="btn btn-success" @click="resetGame">再来一局</button>
        <button class="btn btn-primary" @click="toggleMoveNumbers">
          {{ showMoveNumbers ? '隐藏序号' : '显示序号' }}
        </button>
      </div>
    </div>
    
    <!-- 规则弹窗 -->
    <div v-if="showRules" class="rules-panel">
      <div class="rules-content">
        <h2>📖 游戏规则</h2>
        <div class="rules-body">
          <h3>基本规则</h3>
          <ul>
            <li>黑方先行，双方轮流落子</li>
            <li>棋子落在网格线交点上</li>
            <li>先连成五子者获胜</li>
          </ul>
          <h3>悔棋规则</h3>
          <ul>
            <li>本地对战：直接悔棋</li>
            <li>人机对战：可无限悔棋</li>
            <li>在线对战：需对方同意</li>
          </ul>
        </div>
        <button class="menu-btn primary close-btn" @click="showRules = false">
          知道了
        </button>
      </div>
    </div>
    
    <!-- 历史记录 -->
    <div v-if="showHistory" class="history-panel">
      <div class="history-content">
        <h2>📜 历史记录</h2>
        <div class="history-list">
          <p v-if="gameHistory.length === 0" class="empty">暂无对局记录</p>
          <div v-else class="history-item">
            <span>示例对局 1</span>
            <span class="result">黑方胜</span>
          </div>
        </div>
        <button class="menu-btn primary close-btn" @click="showHistory = false">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useGameStore } from '@/stores/game';
import { useAI } from './composables/useAI';
import MenuScreen from './components/menu/MenuScreen.vue';
import GameBoard from './components/game/GameBoard.vue';
import PlayerInfo from './components/game/PlayerInfo.vue';

const gameStore = useGameStore();
const { isThinking, initAI, makeMove: aiMakeMove, cleanup } = useAI();

// 界面状态
const showMenu = ref(true);
const showGame = ref(false);
const showRules = ref(false);
const showHistory = ref(false);
const gameHistory = ref<any[]>([]);

// 计算属性
const opponentColor = computed(() => gameStore.opponentColor);
const canUndo = computed(() => gameStore.moveHistory.length > 0 && gameStore.isMyTurn);
const showMoveNumbers = computed(() => gameStore.showMoveNumbers);

/**
 * 开始本地对战
 */
function startLocalGame() {
  showMenu.value = false;
  showGame.value = true;
  
  gameStore.myColor = 1;
  gameStore.myName = '玩家1';
  
  gameStore.startGame('local', {
    player1Name: '玩家1',
    player2Name: '玩家2',
    time: 300,
    size: 15
  });
}

/**
 * 开始人机对战
 */
function startAIGame() {
  showMenu.value = false;
  showGame.value = true;
  
  gameStore.myColor = 1;
  gameStore.myName = '玩家';
  
  gameStore.startGame('ai', {
    player1Name: '玩家',
    player2Name: 'AI',
    time: 300,
    size: 15
  });
  
  gameStore.aiColor = 2;
  initAI('medium');
}

/**
 * 开始在线对战
 */
function startOnlineGame() {
  // TODO: 实现在线对战
  alert('在线对战功能开发中...');
}

/**
 * 悔棋
 */
function undo() {
  if (gameStore.gameMode === 'ai') {
    // 人机模式：悔两步
    gameStore.undo();
    gameStore.undo();
  } else {
    // 本地模式：悔一步
    gameStore.undo();
  }
}

/**
 * 认输
 */
function surrender() {
  if (confirm('确定要认输吗？')) {
    gameStore.endGame();
    alert('你认输了！');
  }
}

/**
 * 再来一局
 */
function resetGame() {
  if (gameStore.gameMode === 'ai') {
    // AI 模式：重置游戏
    gameStore.resetGame();
    
    // 如果 AI 执黑，让 AI 先下
    if (gameStore.aiColor === 1) {
      setTimeout(() => aiMakeMove(), 300);
    }
  } else {
    gameStore.resetGame();
  }
}

/**
 * 切换序号显示
 */
function toggleMoveNumbers() {
  gameStore.showMoveNumbers = !gameStore.showMoveNumbers;
}

/**
 * 监听 AI 回合
 */
watch(() => gameStore.isAiTurn, (isAiTurn) => {
  if (isAiTurn && gameStore.isPlaying) {
    setTimeout(() => aiMakeMove(), 300);
  }
});

/**
 * 监听游戏结束
 */
watch(() => gameStore.isEnding, (isEnding) => {
  if (isEnding) {
    const winner = gameStore.currentPlayer === 1 ? '黑方' : '白方';
    setTimeout(() => {
      alert(`🎉 ${winner}获胜！`);
    }, 500);
  }
});

onMounted(() => {
  // 加载历史记录
  const saved = localStorage.getItem('gomoku_history');
  if (saved) {
    gameHistory.value = JSON.parse(saved);
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  color: #fff;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

.game-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-warning {
  background: #f-f39c12;
  color: #fff;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
}

.btn-success {
  background: #2ecc71;
  color: #fff;
}

.btn-primary {
  background: #3498db;
  color: #fff;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 规则弹窗 */
.rules-panel,
.history-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.rules-content,
.history-content {
  background: #2c3e50;
  padding: 30px;
  border-radius: 15px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.rules-body,
.history-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.rules-body h2,
.history-content h2 {
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

.empty {
  color: #999;
  text-align: center;
  padding: 40px 0;
}

.menu-btn {
  width: 100%;
  padding: 15px;
  margin-top: 20px;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}

.menu-btn.primary {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
}

.result {
  color: #2ecc71;
  font-weight: 600;
}
</style>
