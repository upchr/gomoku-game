<template>
  <div class="board-container">
    <div class="board" :style="{ width: boardSize * pieceSize + 'px' }">
      <div
        v-for="(row, rowIndex) in board"
        :key="rowIndex"
        class="board-row"
        :style="{ height: pieceSize + 'px' }"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="cell"
          :class="{
            'winning': isWinningCell(rowIndex, colIndex),
            'preview': previewCell?.row === rowIndex && previewCell?.col === colIndex
          }"
          :style="{ width: pieceSize + 'px', height: pieceSize + 'px' }"
          @click="handleClick(rowIndex, colIndex)"
          @mouseenter="handleMouseEnter(rowIndex, colIndex)"
          @mouseleave="handleMouseLeave"
        >
          <!-- 棋子 -->
          <div
            v-if="cell !== 0"
            class="piece"
            :class="{ black: cell === 1, white: cell === 2 }"
            :style="{ width: pieceSize + 'px', height: pieceSize + 'px' }"
          >
            <!-- 序号 -->
            <span v-if="showMoveNumbers" class="move-number">
              {{ getMoveNumber(rowIndex, colIndex) }}
            </span>
          </div>
          
          <!-- 星位标记 -->
          <div v-if="isStarPosition(rowIndex, colIndex)" class="star" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';

const gameStore = useGameStore();

const pieceSize = computed(() => 40);
const board = computed(() => gameStore.board);
const boardSize = computed(() => gameStore.boardSize);
const previewCell = computed(() => gameStore.previewCell);
const showMoveNumbers = computed(() => gameStore.showMoveNumbers);
const winningLine = computed(() => gameStore.winningLine);

/**
 * 点击格子
 */
function handleClick(row: number, col: number) {
  if (gameStore.isPlaying && !gameStore.isAiTurn && board.value[row][col] === 0) {
    gameStore.makeMove(row, col);
  }
}

/**
 * 鼠标进入格子
 */
function handleMouseEnter(row: number, col: number) {
  if (gameStore.isPlaying && board.value[row][col] === 0) {
    gameStore.previewCell = { row, col };
  }
}

/**
 * 鼠标离开格子
 */
function handleMouseLeave() {
  gameStore.previewCell = null;
}

/**
 * 是否为胜利连线
 */
function isWinningCell(row: number, col: number) {
  const index = row * boardSize.value + col;
  return winningLine.value.includes(index);
}

/**
 * 获取落子序号
 */
function getMoveNumber(row: number, col: number) {
  return gameStore.moveHistory.findIndex(m => m.row === row && m.col === col) + 1;
}

/**
 * 是否为星位
 */
function isStarPosition(row: number, col: number) {
  const size = boardSize.value;
  const center = Math.floor(size / 2);
  const offset = Math.floor(size / 4);
  
  return (
    (row === center && col === center) ||
    (row === offset && col === offset) ||
    (row === offset && col === size - offset - 1) ||
    (row === size - offset - 1 && col === offset) ||
    (row === size - offset - 1 && col === size - offset - 1)
  );
}
</script>

<style scoped>
.board-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.board {
  background: #DEB887;
  border: 3px solid #8B4513;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.board-row {
  display: flex;
  border-bottom: 1px solid #8B4513;
}

.cell {
  position: relative;
  border-right: 1px solid #8B4513;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.cell.preview {
  background-color: rgba(0, 0, 0, 0.1);
}

.cell.winning {
  background-color: rgba(255, 215, 0, 0.2);
}

.piece {
  position: absolute;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #666, #000);
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
  border: 1px solid #ccc;
}

.move-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 2px black;
}

.star {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #8B4513;
  border-radius: 50%;
}
</style>
