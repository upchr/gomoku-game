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
      gameStore.aiWorker = new Worker('/ai-worker.js');
      gameStore.aiWorker.onmessage = (e: MessageEvent) => {
        const result = e.data;
        if (result.requestId !== gameStore.currentAiRequestId) return;
        if (result.success && result.move) {
          gameStore.doPlacePiece(result.move.row, result.move.col, gameStore.aiColor as Player);
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

    gameStore.aiWorker.postMessage({
      requestId: gameStore.currentAiRequestId,
      board: gameStore.board,
      player: gameStore.aiColor,
      difficulty: gameStore.aiDifficulty,
      boardSize: gameStore.boardSize,
      startTime: Date.now()
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
