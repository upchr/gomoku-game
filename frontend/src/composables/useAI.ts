import { ref } from 'vue';
import { useGameStore } from '@/stores/game';
import type { Difficulty, Player } from '@/types/game';

export function useAI() {
  const gameStore = useGameStore();
  const isThinking = ref(false);

  function initAI(difficulty: Difficulty) {
    gameStore.aiDifficulty = difficulty;

    if (window.Worker) {
      if (gameStore.aiWorker) {
        gameStore.aiWorker.terminate();
      }
      const workerUrl = new URL('./ai-worker.js', import.meta.url);
      console.log('Worker URL:', workerUrl.href);
      gameStore.aiWorker = new Worker(workerUrl);
      gameStore.aiWorker.onmessage = (e: MessageEvent) => {
        const result = e.data;
        if (result.requestId !== gameStore.currentAiRequestId) return;

        if (!gameStore.isPlaying || gameStore.currentPlayer !== gameStore.aiColor) {
          isThinking.value = false;
          return;
        }

        if (result.success && result.move) {
          const thinkTime = Math.ceil((result.thinkTime || 0) / 1000);
          if (thinkTime > 0 && gameStore.players[gameStore.aiColor as Player]) {
            gameStore.players[gameStore.aiColor as Player].time = Math.max(
              0,
              gameStore.players[gameStore.aiColor as Player].time - thinkTime
            );
          }
          gameStore.doPlacePiece(result.move.row, result.move.col, gameStore.aiColor as Player);
        } else {
          console.error('AI: 计算失败', result.error);
        }
        isThinking.value = false;
      };
      gameStore.aiWorker.onerror = (err) => {
        console.error('AI Worker error', err);
        isThinking.value = false;
      };
    }
  }

  function makeMove() {
    if (!gameStore.aiWorker || isThinking.value) return;
    if (!gameStore.isPlaying || gameStore.isEnding) return;
    if (gameStore.currentPlayer !== gameStore.aiColor) return;

    isThinking.value = true;
    gameStore.aiRequestCounter++;
    gameStore.currentAiRequestId = gameStore.aiRequestCounter;

    const timeLimits: Record<string, number> = {
      easy: 200,
      medium: 500,
      hard: 1000
    };
    const timeLimit = timeLimits[gameStore.aiDifficulty] || 1000;

    const plainBoard = JSON.parse(JSON.stringify(gameStore.board));

    gameStore.aiWorker.postMessage({
      requestId: gameStore.currentAiRequestId,
      board: plainBoard,
      player: gameStore.aiColor,
      difficulty: gameStore.aiDifficulty,
      boardSize: gameStore.boardSize,
      timeLimit: timeLimit
    });
  }

  function cleanup() {
    gameStore.cleanupAI();
    isThinking.value = false;
  }

  return {
    isThinking,
    initAI,
    makeMove,
    cleanup
  };
}
