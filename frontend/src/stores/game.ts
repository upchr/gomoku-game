import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Player, GameMode, Move, PlayerInfo, MatchMode, Difficulty, WinResult, GameHistory, ChatMessage } from '@/types/game';

export const useGameStore = defineStore('game', () => {
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
  const pendingRoomCode = ref('');
  const previewCell = ref<{ row: number; col: number } | null>(null);
  const undoRequested = ref(false);
  const matchMode = ref<MatchMode>(1);
  const matchWins = ref<Record<Player, number>>({ 1: 0, 2: 0 });
  const currentRound = ref(1);
  const undoLimit = ref(3);
  const winningLine = ref<WinResult[]>([]);
  const aiColor = ref<Player | null>(null);
  const aiDifficulty = ref<Difficulty>('medium');
  const showMoveNumbers = ref(false);
  const matchEnded = ref(false);
  const isHost = ref(false);
  const myUserId = ref('');
  const myPlayerIndex = ref(0);
  const opponentName = ref('');
  const boardScale = ref(1);
  const pieceSize = ref(24);
  const chatMessages = ref<ChatMessage[]>([]);

  const timer = ref<ReturnType<typeof setInterval> | null>(null);
  const endGameTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
  const aiMoveTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
  const aiWorker = ref<Worker | null>(null);
  const aiRequestCounter = ref(0);
  const currentAiRequestId = ref<number | null>(null);

  const opponentColor = computed(() => (myColor.value === 1 ? 2 : 1) as Player);
  const isMyTurn = computed(() => currentPlayer.value === myColor.value);
  const isAiTurn = computed(() => aiColor.value !== null && currentPlayer.value === aiColor.value);

  function addChatMessage(text: string, sender: 'me' | 'opponent', type: 'text' | 'emoji' = 'text') {
    chatMessages.value.push({
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender,
      type,
      timestamp: Date.now()
    });
    // 限制消息数量，最多保留50条
    if (chatMessages.value.length > 50) {
      chatMessages.value = chatMessages.value.slice(-50);
    }
  }

  function clearChatMessages() {
    chatMessages.value = [];
  }

  function initBoard(size: number = 15) {
    boardSize.value = size;
    board.value = Array(size).fill(null).map(() => Array(size).fill(0));
  }

  function startGame(mode: GameMode, config?: {
    player1?: string;
    player2?: string;
    time?: number;
    size?: number;
    matchMode?: MatchMode;
  }) {
    gameMode.value = mode;
    initBoard(config?.size || 15);
    currentPlayer.value = 1;
    moveHistory.value = [];
    winningLine.value = [];
    isEnding.value = false;
    previewCell.value = null;
    undoRequested.value = false;
    showMoveNumbers.value = false;
    matchEnded.value = false;
    clearChatMessages();

    gameTime.value = config?.time || 300;
    players.value[1] = {
      name: config?.player1 || '黑方',
      time: gameTime.value,
      moves: 0,
      undoLeft: undoLimit.value
    };
    players.value[2] = {
      name: config?.player2 || '白方',
      time: gameTime.value,
      moves: 0,
      undoLeft: undoLimit.value
    };

    matchMode.value = config?.matchMode || 1;
    matchWins.value = { 1: 0, 2: 0 };
    currentRound.value = 1;

    startTime.value = Date.now();
    isPlaying.value = true;

    if (gameTime.value > 0) startTimer();
  }

  function doPlacePiece(row: number, col: number, player: Player) {
    board.value[row][col] = player;
    players.value[player].moves++;
    moveHistory.value.push({ row, col, player, timestamp: Date.now() });

    const winResult = checkWin(row, col, player);
    if (winResult) {
      winningLine.value = winResult;
      if (gameMode.value !== 'online') {
        matchWins.value[player]++;
        isEnding.value = true;
        endGameTimeout.value = setTimeout(() => {
          isEnding.value = false;
          endGameTimeout.value = null;
          endGame(player);
        }, 2000);
      }
      return true;
    }

    if (moveHistory.value.length === boardSize.value * boardSize.value) {
      if (gameMode.value !== 'online') {
        isEnding.value = true;
        endGameTimeout.value = setTimeout(() => {
          isEnding.value = false;
          endGameTimeout.value = null;
          endGame(0 as Player);
        }, 1000);
      }
      return true;
    }

    currentPlayer.value = (currentPlayer.value === 1 ? 2 : 1) as Player;

    return true;
  }

  function makeMove(row: number, col: number, player?: Player): boolean {
    if (!isPlaying.value || isEnding.value || board.value[row][col] !== 0) return false;
    const actualPlayer = player || currentPlayer.value;
    if (gameMode.value === 'online' && currentPlayer.value !== myColor.value) return false;
    doPlacePiece(row, col, actualPlayer as Player);
    return true;
  }

  function checkWin(row: number, col: number, player: Player): WinResult[] | null {
    const directions: [number, number][][] = [
      [[0, 1], [0, -1]],
      [[1, 0], [-1, 0]],
      [[1, 1], [-1, -1]],
      [[1, -1], [-1, 1]]
    ];

    for (const dir of directions) {
      let count = 1;
      const line: WinResult[] = [{ row, col }];

      for (const [dr, dc] of dir) {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < boardSize.value && c >= 0 && c < boardSize.value && board.value[r][c] === player) {
          count++;
          line.push({ row: r, col: c });
          r += dr;
          c += dc;
        }
      }

      if (count >= 5) return line;
    }
    return null;
  }

  function endGame(winner: Player | 0) {
    clearAllTimers();
    cleanupAI();
    isPlaying.value = false;
    isEnding.value = false;
    showMoveNumbers.value = true;

    const targetWins = Math.ceil(matchMode.value / 2);
    if (matchMode.value === 1) {
      matchEnded.value = true;
    } else if (matchMode.value > 1) {
      if (matchWins.value[1] >= targetWins || matchWins.value[2] >= targetWins) {
        matchEnded.value = true;
      }
    }

    saveGameHistory(winner);
  }

  function doUndo() {
    if (moveHistory.value.length === 0) return false;

    if (gameMode.value === 'ai') {
      if (moveHistory.value.length >= 2) {
        const lastMove = moveHistory.value[moveHistory.value.length - 1];
        if (lastMove.player === aiColor.value) {
          const aiMove = moveHistory.value.pop()!;
          board.value[aiMove.row][aiMove.col] = 0;
          players.value[aiMove.player].moves--;
        }
      }
      if (moveHistory.value.length >= 1) {
        const lastMove = moveHistory.value[moveHistory.value.length - 1];
        if (lastMove.player !== aiColor.value) {
          const playerMove = moveHistory.value.pop()!;
          board.value[playerMove.row][playerMove.col] = 0;
          players.value[playerMove.player].moves--;
          players.value[playerMove.player].undoLeft--;
          currentPlayer.value = playerMove.player;
        }
      }
    } else {
      const lastMove = moveHistory.value.pop();
      if (lastMove) {
        board.value[lastMove.row][lastMove.col] = 0;
        players.value[lastMove.player].moves--;
        currentPlayer.value = lastMove.player;
        if (gameMode.value === 'local') {
          players.value[lastMove.player].undoLeft--;
        }
      }
    }

    previewCell.value = null;
    return true;
  }

  function undo() {
    if (!isPlaying.value) return false;
    if (moveHistory.value.length === 0) return false;
    const myP = myColor.value;
    if (players.value[myP].undoLeft <= 0 && gameMode.value !== 'local') return false;
    return doUndo();
  }

  function resetGame() {
    clearAllTimers();
    initBoard(boardSize.value);
    currentPlayer.value = 1;
    moveHistory.value = [];
    winningLine.value = [];
    isEnding.value = false;
    previewCell.value = null;
    undoRequested.value = false;
    showMoveNumbers.value = false;
    matchEnded.value = false;

    players.value[1].moves = 0;
    players.value[2].moves = 0;
    players.value[1].undoLeft = undoLimit.value;
    players.value[2].undoLeft = undoLimit.value;
    players.value[1].time = gameTime.value;
    players.value[2].time = gameTime.value;

    startTime.value = Date.now();
    isPlaying.value = true;

    if (gameTime.value > 0) startTimer();
  }

  function swapColorsAndRestart() {
    if (gameMode.value === 'ai') {
      myColor.value = (myColor.value === 1 ? 2 : 1) as Player;
      aiColor.value = (aiColor.value === 1 ? 2 : 1) as Player;
    } else if (gameMode.value === 'local') {
      myColor.value = (myColor.value === 1 ? 2 : 1) as Player;
    }

    const mn = myName.value || '玩家';
    const on = opponentName.value || (gameMode.value === 'ai' ? 'AI' : '对手');
    const aiName = aiDifficulty.value === 'easy' ? 'AI(简单)' : aiDifficulty.value === 'medium' ? 'AI(中等)' : 'AI(困难)';
    const oppDisplay = gameMode.value === 'ai' ? aiName : on;

    players.value[1] = {
      name: myColor.value === 1 ? mn : oppDisplay,
      time: gameTime.value,
      moves: 0,
      undoLeft: undoLimit.value
    };
    players.value[2] = {
      name: myColor.value === 2 ? mn : oppDisplay,
      time: gameTime.value,
      moves: 0,
      undoLeft: undoLimit.value
    };

    currentRound.value++;
    resetGame();
  }

  function startTimer() {
    stopTimer();
    timer.value = setInterval(() => {
      if (!isPlaying.value) return;
      // 在线对战模式下，前端每秒只更新当前玩家时间显示（不实际扣时）
      // 实际扣时由服务器通过time_sync消息更新
      if (gameMode.value === 'online') {
        // 前端只做简单的显示更新，不影响实际时间
        // 实际时间由服务器通过time_sync消息同步
        return;
      }
      players.value[currentPlayer.value].time--;
      if (players.value[currentPlayer.value].time <= 0) {
        const winner = currentPlayer.value === 1 ? 2 : 1;
        endGame(winner as Player);
      }
    }, 1000);
  }

  function stopTimer() {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  }

  function clearAllTimers() {
    stopTimer();
    if (endGameTimeout.value) {
      clearTimeout(endGameTimeout.value);
      endGameTimeout.value = null;
    }
    if (aiMoveTimeout.value) {
      clearTimeout(aiMoveTimeout.value);
      aiMoveTimeout.value = null;
    }
  }

  const onAITurn = ref<(() => void) | null>(null);

  function initAI(difficulty: Difficulty) {
    aiDifficulty.value = difficulty;
  }

  function triggerAIMove() {
    if (onAITurn.value) onAITurn.value();
  }

  function setOnAITurn(callback: () => void) {
    onAITurn.value = callback;
  }

  function cleanupAI() {
    if (aiWorker.value) {
      aiWorker.value.terminate();
      aiWorker.value = null;
    }
    currentAiRequestId.value = null;
  }

  function saveGameHistory(winner: Player | 0) {
    try {
      const history = JSON.parse(localStorage.getItem('gomoku_history') || '[]');
      history.unshift({
        date: new Date().toLocaleString(),
        player1: players.value[1].name,
        player2: players.value[2].name,
        winner: winner === 0 ? '平局' : players.value[winner].name,
        moves: moveHistory.value.length,
        mode: gameMode.value
      });
      if (history.length > 50) history.pop();
      localStorage.setItem('gomoku_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save game history', e);
    }
  }

  function loadGameHistory(): GameHistory[] {
    try {
      return JSON.parse(localStorage.getItem('gomoku_history') || '[]');
    } catch {
      return [];
    }
  }

  function clearGameHistory() {
    localStorage.removeItem('gomoku_history');
  }

  function backToMenu() {
    clearAllTimers();
    cleanupAI();
    isPlaying.value = false;
    matchWins.value = { 1: 0, 2: 0 };
    currentRound.value = 1;
    previewCell.value = null;
    roomCode.value = '';
    pendingRoomCode.value = '';
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function validateNickname(name: string | null | undefined): string {
    if (!name) return '玩家';
    let trimmed = name.trim();
    if (trimmed.length > 20) trimmed = trimmed.substring(0, 20);
    const filtered = trimmed.replace(/[<>"'&]/g, '');
    return filtered || '玩家';
  }

  function exportGame() {
    if (isPlaying.value || moveHistory.value.length === 0) return;

    const size = boardSize.value;
    const cellSize = 28;
    const padding = 20;
    const canvasSize = cellSize * (size - 1) + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i++) {
      const pos = padding + i * cellSize;
      ctx.beginPath(); ctx.moveTo(pos, padding); ctx.lineTo(pos, padding + (size - 1) * cellSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padding, pos); ctx.lineTo(padding + (size - 1) * cellSize, pos); ctx.stroke();
    }

    const starPoints = size === 15
      ? [[7, 7], [3, 3], [3, 7], [3, 11], [7, 3], [7, 11], [11, 3], [11, 7], [11, 11]]
      : size === 19
        ? [[9, 9], [3, 3], [3, 9], [3, 15], [9, 3], [9, 15], [15, 3], [15, 9], [15, 15]]
        : size === 13
          ? [[6, 6], [3, 3], [3, 6], [3, 9], [6, 3], [6, 9], [9, 3], [9, 6], [9, 9]]
          : [];

    ctx.fillStyle = '#8b6914';
    for (const [r, c] of starPoints) {
      ctx.beginPath();
      ctx.arc(padding + c * cellSize, padding + r * cellSize, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const pSize = cellSize * 0.85;
    for (let i = 0; i < moveHistory.value.length; i++) {
      const move = moveHistory.value[i];
      const x = padding + move.col * cellSize;
      const y = padding + move.row * cellSize;

      ctx.beginPath();
      ctx.arc(x, y, pSize / 2, 0, Math.PI * 2);

      if (move.player === 1) {
        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, pSize / 2);
        gradient.addColorStop(0, '#555');
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, pSize / 2);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, '#ccc');
        ctx.fillStyle = gradient;
      }
      ctx.fill();

      ctx.font = `bold ${Math.floor(cellSize * 0.45)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = move.player === 1 ? '#fff' : '#000';
      ctx.fillText(String(i + 1), x, y);
    }

    const link = document.createElement('a');
    link.download = `gomoku_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return {
    board, boardSize, currentPlayer, players, gameTime, gameMode,
    isPlaying, isEnding, startTime, moveHistory, myColor, myName,
    roomCode, pendingRoomCode, previewCell, undoRequested,
    matchMode, matchWins, currentRound, undoLimit, winningLine,
    aiColor, aiDifficulty, showMoveNumbers, matchEnded,
    isHost, myUserId, myPlayerIndex, opponentName,
    boardScale, pieceSize, chatMessages,
    timer, endGameTimeout, aiMoveTimeout, aiWorker,
    aiRequestCounter, currentAiRequestId,

    opponentColor, isMyTurn, isAiTurn,

    initBoard, startGame, makeMove, doPlacePiece, checkWin,
    endGame, undo, doUndo, resetGame, swapColorsAndRestart,
    startTimer, stopTimer, clearAllTimers,
    initAI, triggerAIMove, setOnAITurn, cleanupAI,
    saveGameHistory, loadGameHistory, clearGameHistory,
    backToMenu, formatTime, validateNickname, exportGame,
    addChatMessage, clearChatMessages
  };
});
