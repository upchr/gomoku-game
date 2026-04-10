<template>
  <div class="board-container">
    <div class="board" :style="boardStyle">
      <div id="board-inner" :style="innerStyle">
        <svg class="board-svg" :width="svgSize" :height="svgSize">
          <rect :width="svgSize" :height="svgSize" fill="#d4a574" rx="6" />
          <line
            v-for="i in boardSize"
            :key="'v' + i"
            :x1="padding + (i - 1) * cellSize"
            :y1="padding"
            :x2="padding + (i - 1) * cellSize"
            :y2="padding + (boardSize - 1) * cellSize"
            :stroke="'#8b6914'"
            :stroke-width="scale"
          />
          <line
            v-for="i in boardSize"
            :key="'h' + i"
            :x1="padding"
            :y1="padding + (i - 1) * cellSize"
            :x2="padding + (boardSize - 1) * cellSize"
            :y2="padding + (i - 1) * cellSize"
            :stroke="'#8b6914'"
            :stroke-width="scale"
          />
          <circle
            v-for="(sp, idx) in starPoints"
            :key="'sp' + idx"
            :cx="padding + sp[1] * cellSize"
            :cy="padding + sp[0] * cellSize"
            :r="3 * scale"
            fill="#8b6914"
          />
        </svg>
        <div
          v-for="i in boardSize"
          :key="'cr' + i"
        >
          <div
            v-for="j in boardSize"
            :key="'cc' + i + '_' + j"
            class="cell"
            :style="cellStyle(i - 1, j - 1)"
            :class="{
              'preview': previewCell?.row === i - 1 && previewCell?.col === j - 1,
              'has-piece': board[i - 1][j - 1] !== 0
            }"
            @click="handleCellClick(i - 1, j - 1)"
          >
            <div
              v-if="board[i - 1][j - 1] !== 0"
              class="piece"
              :class="[
                board[i - 1][j - 1] === 1 ? 'black' : 'white',
                { 'last-move': isLastMove(i - 1, j - 1), 'winning': isWinningCell(i - 1, j - 1) }
              ]"
              :style="pieceStyle"
            >
              <span v-if="showMoveNumbers" class="move-number">
                {{ getMoveNumber(i - 1, j - 1) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '@/stores/game';
import { useWebSocketStore } from '@/stores/websocket';

const gameStore = useGameStore();
const wsStore = useWebSocketStore();
const winW = ref(window.innerWidth);
const winH = ref(window.innerHeight);

const board = computed(() => gameStore.board);
const boardSize = computed(() => gameStore.boardSize);
const previewCell = computed(() => gameStore.previewCell);
const showMoveNumbers = computed(() => gameStore.showMoveNumbers);
const winningLine = computed(() => gameStore.winningLine);
const moveHistory = computed(() => gameStore.moveHistory);

const baseCellSize = 30;
const basePadding = 15;
const baseBoardSize = computed(() => baseCellSize * (boardSize.value - 1) + basePadding * 2);

const scale = computed(() => {
  const maxW = winW.value - 20;
  const topReserved = 90;
  const bottomReserved = 80;
  const maxH = winH.value - topReserved - bottomReserved;
  return Math.min(maxW / baseBoardSize.value, maxH / baseBoardSize.value, 1.2);
});

const cellSize = computed(() => baseCellSize * scale.value);
const padding = computed(() => basePadding * scale.value);
const svgSize = computed(() => baseBoardSize.value * scale.value);
const pieceSizeVal = computed(() => cellSize.value * 0.85);

const boardStyle = computed(() => ({
  width: svgSize.value + 'px',
  height: svgSize.value + 'px'
}));

const innerStyle = computed(() => ({
  width: svgSize.value + 'px',
  height: svgSize.value + 'px',
  position: 'relative' as const
}));

const pieceStyle = computed(() => ({
  width: pieceSizeVal.value + 'px',
  height: pieceSizeVal.value + 'px'
}));

const starPoints = computed(() => {
  const s = boardSize.value;
  if (s === 15) return [[7,7],[3,3],[3,7],[3,11],[7,3],[7,11],[11,3],[11,7],[11,11]];
  if (s === 19) return [[9,9],[3,3],[3,9],[3,15],[9,3],[9,15],[15,3],[15,9],[15,15]];
  if (s === 13) return [[6,6],[3,3],[3,6],[3,9],[6,3],[6,9],[9,3],[9,6],[9,9]];
  return [];
});

function cellStyle(row: number, col: number) {
  const cs = cellSize.value;
  const p = padding.value;
  return {
    width: cs + 'px',
    height: cs + 'px',
    left: (p + col * cs - cs / 2) + 'px',
    top: (p + row * cs - cs / 2) + 'px'
  };
}

function handleCellClick(row: number, col: number) {
  if (!gameStore.isPlaying || gameStore.isEnding) return;
  if (board.value[row][col] !== 0) return;
  if (gameStore.gameMode === 'online' && gameStore.currentPlayer !== gameStore.myColor) return;
  if (gameStore.gameMode === 'ai' && gameStore.currentPlayer !== gameStore.myColor) return;

  if (previewCell.value && previewCell.value.row === row && previewCell.value.col === col) {
    gameStore.previewCell = null;
    confirmPlacePiece(row, col);
  } else {
    gameStore.previewCell = null;
    gameStore.previewCell = { row, col };
  }
}

function confirmPlacePiece(row: number, col: number) {
  if (gameStore.isEnding) return;
  if (gameStore.gameMode === 'online') {
    wsStore.placePiece(row, col);
  } else {
    gameStore.makeMove(row, col);
  }
}

function isLastMove(row: number, col: number) {
  if (moveHistory.value.length === 0) return false;
  const last = moveHistory.value[moveHistory.value.length - 1];
  return last.row === row && last.col === col;
}

function isWinningCell(row: number, col: number) {
  return winningLine.value.some(w => w.row === row && w.col === col);
}

function getMoveNumber(row: number, col: number) {
  const idx = moveHistory.value.findIndex(m => m.row === row && m.col === col);
  return idx >= 0 ? idx + 1 : 0;
}

let resizeTimeout: ReturnType<typeof setTimeout>;
function onResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    winW.value = window.innerWidth;
    winH.value = window.innerHeight;
  }, 100);
}

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  clearTimeout(resizeTimeout);
});

watch(scale, () => {
  gameStore.boardScale = scale.value;
  gameStore.pieceSize = pieceSizeVal.value;
});
</script>

<style scoped>
.board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 50vh;
  overflow: hidden;
  padding: 2px 0;
}

.board {
  position: relative;
  flex-shrink: 0;
}

#board-inner {
  position: relative;
}

.board-svg {
  position: absolute;
  top: 0;
  left: 0;
}

.cell {
  position: absolute;
  cursor: pointer;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell:hover {
  background: rgba(0, 0, 0, 0.05);
}

.cell.preview {
  background: rgba(0, 0, 0, 0.1);
}

.piece {
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #666, #000);
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
  border: 1px solid #ccc;
}

.piece.last-move {
  box-shadow: 0 0 0 2px #ff6b6b, 0 2px 8px rgba(0, 0, 0, 0.4);
}

.piece.winning {
  box-shadow: 0 0 0 3px #ffd700, 0 0 15px rgba(255, 215, 0, 0.6);
  animation: winPulse 0.6s ease-in-out infinite alternate;
}

@keyframes winPulse {
  from { transform: scale(1); }
  to { transform: scale(1.1); }
}

.move-number {
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 2px black;
  pointer-events: none;
  user-select: none;
}

.piece.white .move-number {
  color: #000;
  text-shadow: none;
}
</style>
