/**
 * 游戏状态管理 (Pinia)
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameState, Player, GameMode, Move, PlayerInfo, MatchMode } from '@/types/game';

export const useGameStore = defineStore('game', () => {
  // ===== 状态 =====
  const board = ref<number[][]>([]);
  const boardSize = ref(15);
  const currentPlayer = ref<Player>(1);
  const players = ref<Record<Player, PlayerInfo>>({
    1: { name: '黑方', time: 300, moves: 0, undoLeft: 3 },
    2: { name: '白方', time: 300, moves: 0, undoLeft: 3 }
  });
  const gameTime = ref(300);
  const gameMode = ref<GameMode>('local');
  const isPlaying = ref(false);
  const isEnding = ref(false);
  const startTime = ref<number | null>(null);
  const moveHistory = ref<Move[]>([]);
  const myColor = ref<Player>(1);
  const myName = ref('');
  const roomCode = ref('');
  const previewCell = ref<{ row: number; col: number } | null>(null);
  const undoRequested = ref(false);
  const matchMode = ref<MatchMode>(1);
  const matchWins = ref<Record<Player, number>>({ 1: 0, 2: 0 });
  const currentRound = ref(1);
  const undoLimit = ref(3);
  const winningLine = ref<number[]>([]);
  const aiColor = ref<Player | null>(null);
  const aiDifficulty = ref<'easy' | 'medium' | 'hard'>('medium');
  const showMoveNumbers = ref(false);

  // ===== 计算属性 =====
  const opponentColor = computed(() => myColor.value === 1 ? 2 : 1);
  const myPlayer = computed(() => players.value[myColor.value]);
  const opponentPlayer = computed(() => players.value[opponentColor.value]);
  const isMyTurn = computed(() => currentPlayer.value === myColor.value);
  const isAiTurn = computed(() => aiColor.value !== null && currentPlayer.value === aiColor.value);

  // ===== 方法 =====

  /**
   * 初始化棋盘
   */
  function initBoard(size: number = 15) {
    boardSize = ref(size);
    board.value = Array(size).fill(null).map(() => Array(size).fill(0));
  }

  /**
   * 开始游戏
   */
  function startGame(mode: GameMode, config?: {
    player1Name?: string;
    player2Name?: string;
    time?: number;
    size?: number;
    matchMode?: MatchMode;
  }) {
    gameMode.value = mode;
    
    // 重置状态
    initBoard(config?.size || 15);
    currentPlayer.value = 1;
    moveHistory.value = [];
    winningLine.value = [];
    isEnding.value = false;
    
    // 设置玩家信息
    if (config?.player1Name) players.value[1].name = config.player1Name;
    if (config?.player2Name) players.value[2].name = config.player2Name;
    
    // 设置时间
    gameTime.value = config?.time || 300;
    players.value[1].time = gameTime.value;
    players.value[2].time = gameTime.value;
    
    // 设置比赛模式
    matchMode.value = config?.matchMode || 1;
    matchWins.value = { 1: 0, 2: 0 };
    currentRound.value = 1;
    
    // 开始计时
    startTime.value = Date.now();
    isPlaying.value = true;
  }

  /**
   * 落子
   */
  function makeMove(row: number, col: number, player?: Player) {
    if (!isPlaying.value || board.value[row][col] !== 0) return false;
    
    const actualPlayer = player || currentPlayer.value;
    
    // 落子
    board.value[row][col] = actualPlayer;
    
    // 记录历史
    moveHistory.value.push({
      row,
      col,
      player: actualPlayer,
      timestamp: Date.now()
    });
    
    // 更新玩家信息
    players.value[actualPlayer].moves++;
    
    // 检查胜利
    const winner = checkWinner(row, col, actualPlayer);
    if (winner) {
      isEnding.value = true;
      isPlaying.value = false;
      return true;
    }
    
    // 切换玩家
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
    
    return true;
  }

  /**
   * 检查胜利
   */
  function checkWinner(row: number, col: number, player: Player): Player | null {
    const size = boardSize.value;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    for (const [dx, dy] of directions) {
      let count = 1;
      const line: number[] = [row * size + col];
      
      // 正方向
      for (let i = 1; i < 5; i++) {
        const r = row + dx * i;
        const c = col + dy * i;
        if (r < 0 || r >= size || c < 0 || c >= size || board.value[r][c] !== player) break;
        count++;
        line.push(r * size + c);
      }
      
      // 反方向
      for (let i = 1; i < 5; i++) {
        const r = row - dx * i;
        const c = col - dy * i;
        if (r < 0 || r >= size || c < 0 || c >= size || board.value[r][c] !== player) break;
        count++;
        line.push(r * size + c);
      }
      
      if (count >= 5) {
        winningLine.value = line;
        return player;
      }
    }
    
    return null;
  }

  /**
   * 悔棋
   */
  function undo() {
    if (moveHistory.value.length === 0) return false;
    
    const lastMove = moveHistory.value.pop();
    if (!lastMove) return false;
    
    board.value[lastMove.row][lastMove.col] = 0;
    players.value[lastMove.player].moves--;
    currentPlayer.value = lastMove.player;
    
    return true;
  }

  /**
   * 结束当前游戏
   */
  function endGame() {
    isPlaying.value = false;
    isEnding.value = true;
  }

  /**
   * 重置游戏（再来一局）
）
  function resetGame() {
    initBoard(boardSize.value);
    currentPlayer.value = 1;
    moveHistory.value = [];
    winningLine.value = [];
    isEnding.value = false;
    
    // 重置玩家信息（不重置时间，由外部控制）
    players.value[1].moves = 0;
    players.value[2].moves = 0;
    players.value[1].undoLeft = undoLimit.value;
    players.value[2].undoLeft = undoLimit.value;
    
    startTime.value = Date.now();
    isPlaying.value = true;
  }

  /**
   * 更新玩家时间
   */
  function updateTime(player: Player, time: number) {
    players.value[player].time = time;
  }

  /**
   * 更新玩家悔棋次数
   */
  function updateUndoLeft(player: Player, count: number) {
    players.value[player].undoLeft = count;
  }

  return {
    // 状态
    board,
    boardSize,
    currentPlayer,
    players,
    gameTime,
    gameMode,
    isPlaying,
    isEnding,
    startTime,
    moveHistory,
    myColor,
    myName,
    roomCode,
    previewCell,
    undoRequested,
    matchMode,
    matchWins,
    currentRound,
    undoLimit,
    winningLine,
    aiColor,
    aiDifficulty,
    showMoveNumbers,
    
    // 计算属性
    opponentColor,
    myPlayer,
    opponentPlayer,
    isMyTurn,
    isAiTurn,
    
    // 方法
    initBoard,
    startGame,
    makeMove,
    checkWinner,
    undo,
    endGame,
    resetGame,
    updateTime,
    updateUndoLeft
  };
});
