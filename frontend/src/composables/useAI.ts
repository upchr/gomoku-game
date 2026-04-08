/**
 * AI 集成
 */
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores/game';
import GomokuAI from '@/utils/ai.js';

export function useAI() {
  const gameStore = useGameStore();
  const aiEngine = ref<GomokuAI | null>(null);
  const isThinking = ref(false);
  const worker = ref<Worker | null>(null);
  const aiRequestCounter = ref(0);
  const currentAiRequestId = ref(0);

  /**
   * 初始化 AI
   */
  function initAI(difficulty: 'easy' | 'medium' | 'hard') {
    gameStore.aiDifficulty = difficulty;
    aiEngine.value = new GomokuAI(difficulty, gameStore.boardSize);
    
    // 初始化 Web Worker
    if (window.Worker) {
      worker.value = new Worker('/src/utils/ai-worker.js');
      
      worker.value.onmessage = (e) => {
        const result = e.data;
        
        // 检查请求 ID
        if (result.requestId !== currentAiRequestId.value) {
          console.log('AI: 忽略过期响应');
          return;
        }
        
        if (result.success && result.move) {
          gameStore.makeMove(result.move.row, result.move.col);
          isThinking.value = false;
        }
      };
    }
  }

  /**
   * AI 落子
   */
  async function makeMove() {
    if (!aiEngine.value || !worker.value || isThinking.value) return;
    
    if (!gameStore.isPlaying || gameStore.isEnding) {
      console.log('AI: 游戏未开始或已结束');
      return;
    }
    
    if (gameStore.currentPlayer !== gameStore.aiColor) {
      console.log('AI: 不是 AI 回合');
      return;
    }
    
    isThinking.value = true;
    aiRequestCounter.value++;
    currentAiRequestId.value = aiRequestCounter.value;
    
    // 发送计算请求到 Worker
    worker.value.postMessage({
      requestId: currentAiRequestId.value,
      board: gameStore.board,
      player: gameStore.aiColor!,
      difficulty: gameStore.aiDifficulty,
      startTime: Date.now()
    });
  }

  /**
   * 清理资源
   */
  function cleanup() {
    if (worker.value) {
      worker.value.terminate();
      worker.value = null;
    }
    aiEngine.value = null;
  }

  return {
    isThinking,
    initAI,
    makeMove,
    cleanup
  };
}
