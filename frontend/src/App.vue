<template>
  <div id="app">
    <MenuScreen
      v-if="currentScreen === 'menu'"
      @start-local="showLocalSetup"
      @start-ai="showAISetup"
      @start-online="showOnlineSetup"
      @show-history="currentScreen = 'history'"
      @show-rules="showRules = true"
    />

    <div v-if="currentScreen === 'game'" class="game-screen">
      <div v-if="matchMode > 1" class="score-display">
        <span class="match-info">第 {{ currentRound }} 局</span>
        | 比分 {{ matchWins[1] }} : {{ matchWins[2] }}
      </div>

      <PlayerInfo
        :player="players[opponentColor]"
        :color="opponentColor"
        :is-me="false"
        :is-current-turn="currentPlayer === opponentColor"
      />

      <GameBoard />

      <PlayerInfo
        :player="players[myColor]"
        :color="myColor"
        :is-me="true"
        :is-current-turn="currentPlayer === myColor"
      />

      <GameControls
        :game-state="gameStateForControls"
        :show-move-numbers="showMoveNumbers"
        :show-emoji-popup="showEmojiPopup"
        @undo="handleUndo"
        @surrender="handleSurrender"
        @play-again="handlePlayAgain"
        @toggle-numbers="gameStore.showMoveNumbers = !gameStore.showMoveNumbers"
        @export-game="exportGame"
        @exit-room="handleExitRoom"
        @quick-msg="handleQuickMsg"
        @toggle-emoji="showEmojiPopup = !showEmojiPopup"
        @send-emoji="handleSendEmoji"
      />
    </div>

    <LocalSetupPanel
      v-model:visible="panels.localSetup"
      @start="startLocalGame"
    />

    <AISetupPanel
      v-model:visible="panels.aiSetup"
      @start="startAIGame"
    />

    <OnlinePanel
      ref="onlinePanelRef"
      v-model:visible="panels.onlineSetup"
      @create-room="showCreateRoom"
      @refresh-room-list="refreshRoomList"
      @join-room="handleJoinRoom"
      @join-room-by-code="handleJoinRoomByCode"
    />

    <CreateRoomPanel
      v-model:visible="panels.createRoom"
      @create="handleCreateRoom"
    />

    <WaitingPanel
      v-model:visible="panels.waiting"
      :room-code="roomCode"
      :password="createRoomPassword"
      @cancel="cancelWaiting"
    />

    <PasswordPanel
      v-model:visible="panels.password"
      :room-code="pendingRoomCode"
      @submit="submitPassword"
    />

    <RulesPanel
      :visible="showRules"
      @close="showRules = false"
    />

    <HistoryPanel
      :visible="currentScreen === 'history'"
      @close="currentScreen = 'menu'"
      @show-toast="showToast"
    />

    <WinModal
      :visible="showWinModal"
      :winner-name="winnerName"
      :match-result="matchResultText"
      :show-ready-status="gameMode === 'online'"
      :ready-status="readyStatusText"
      :ready-disabled="isReady"
      :ready-button-text="readyButtonText"
      @ready="handleReady"
      @close="showWinModal = false"
    />

    <UndoRequestModal
      :visible="showUndoRequest"
      :request-text="undoRequestText"
      @accept="acceptUndo"
      @reject="rejectUndo"
    />

    <Toast
      :message="toastMessage"
      :visible="toastVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game';
import { useWebSocketStore } from '@/stores/websocket';
import { useAI } from '@/composables/useAI';
import type { Player, GameMode, MatchMode, Difficulty, Room } from '@/types/game';

import MenuScreen from '@/components/menu/MenuScreen.vue';
import GameBoard from '@/components/game/GameBoard.vue';
import PlayerInfo from '@/components/game/PlayerInfo.vue';
import GameControls from '@/components/game/GameControls.vue';
import LocalSetupPanel from '@/components/online/LocalSetupPanel.vue';
import AISetupPanel from '@/components/online/AISetupPanel.vue';
import OnlinePanel from '@/components/online/OnlinePanel.vue';
import CreateRoomPanel from '@/components/online/CreateRoomPanel.vue';
import WaitingPanel from '@/components/online/WaitingPanel.vue';
import PasswordPanel from '@/components/online/PasswordPanel.vue';
import RulesPanel from '@/components/RulesPanel.vue';
import HistoryPanel from '@/components/HistoryPanel.vue';
import WinModal from '@/components/WinModal.vue';
import UndoRequestModal from '@/components/UndoRequestModal.vue';
import Toast from '@/components/Toast.vue';

const gameStore = useGameStore();
const wsStore = useWebSocketStore();
const { isThinking, initAI, makeMove: aiMakeMove, cleanup: aiCleanup } = useAI();

const currentScreen = ref<'menu' | 'game' | 'history'>('menu');
const showRules = ref(false);
const showWinModal = ref(false);
const showUndoRequest = ref(false);
const showEmojiPopup = ref(false);
const undoRequestText = ref('对手请求悔棋，是否同意？');

const toastMessage = ref('');
const toastVisible = ref(false);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const onlinePanelRef = ref<any>(null);
const createRoomPassword = ref('');
const isReady = ref(false);
const readyStatusText = ref('等待双方准备...');

const panels = ref({
  localSetup: false,
  aiSetup: false,
  onlineSetup: false,
  createRoom: false,
  waiting: false,
  password: false
});

const board = computed(() => gameStore.board);
const boardSize = computed(() => gameStore.boardSize);
const currentPlayer = computed(() => gameStore.currentPlayer);
const players = computed(() => gameStore.players);
const myColor = computed(() => gameStore.myColor);
const opponentColor = computed(() => gameStore.opponentColor);
const matchMode = computed(() => gameStore.matchMode);
const matchWins = computed(() => gameStore.matchWins);
const currentRound = computed(() => gameStore.currentRound);
const gameMode = computed(() => gameStore.gameMode);
const showMoveNumbers = computed(() => gameStore.showMoveNumbers);
const roomCode = computed(() => gameStore.roomCode);
const pendingRoomCode = computed(() => gameStore.pendingRoomCode);

const winnerName = computed(() => {
  if (!gameStore.winningLine.length && gameStore.moveHistory.length < boardSize.value * boardSize.value) return '';
  if (gameStore.moveHistory.length === boardSize.value * boardSize.value && !gameStore.winningLine.length) return '平局';
  const lastMove = gameStore.moveHistory[gameStore.moveHistory.length - 1];
  if (!lastMove) return '';
  return players.value[lastMove.player]?.name || '未知';
});

const matchResultText = computed(() => {
  if (matchMode.value === 1) return '';
  return `比分 ${matchWins.value[1]} : ${matchWins.value[2]}`;
});

const readyButtonText = computed(() => {
  if (isReady.value) return '已准备 ✓';
  if (gameMode.value === 'online') {
    return gameStore.matchEnded ? '再赛一轮' : '下一局';
  }
  return '再来一局';
});

const gameStateForControls = computed(() => ({
  board: gameStore.board,
  boardSize: gameStore.boardSize,
  currentPlayer: gameStore.currentPlayer,
  players: gameStore.players,
  gameTime: gameStore.gameTime,
  gameMode: gameStore.gameMode,
  isPlaying: gameStore.isPlaying,
  isEnding: gameStore.isEnding,
  startTime: gameStore.startTime,
  moveHistory: gameStore.moveHistory,
  myColor: gameStore.myColor,
  myName: gameStore.myName,
  roomCode: gameStore.roomCode,
  pendingRoomCode: gameStore.pendingRoomCode,
  previewCell: gameStore.previewCell,
  undoRequested: gameStore.undoRequested,
  matchMode: gameStore.matchMode,
  matchWins: gameStore.matchWins,
  currentRound: gameStore.currentRound,
  undoLimit: gameStore.undoLimit,
  winningLine: gameStore.winningLine,
  aiColor: gameStore.aiColor,
  aiDifficulty: gameStore.aiDifficulty,
  showMoveNumbers: gameStore.showMoveNumbers,
  matchEnded: gameStore.matchEnded,
  isHost: gameStore.isHost,
  myUserId: gameStore.myUserId,
  myPlayerIndex: gameStore.myPlayerIndex,
  opponentName: gameStore.opponentName,
  boardScale: gameStore.boardScale,
  pieceSize: gameStore.pieceSize
}));

function showToast(message: string) {
  toastMessage.value = message;
  toastVisible.value = true;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastVisible.value = false;
  }, 2500);
}

function showLocalSetup() {
  panels.value.localSetup = true;
}

function showAISetup() {
  panels.value.aiSetup = true;
}

function showOnlineSetup() {
  panels.value.onlineSetup = true;
}

function showCreateRoom(nickname: string) {
  gameStore.myName = nickname;
  panels.value.createRoom = true;
}

function startLocalGame(config: { player1: string; player2: string; time: number; size: number; undoLimit: number }) {
  gameStore.undoLimit = config.undoLimit;
  gameStore.myColor = 1;
  gameStore.myName = config.player1;
  gameStore.startGame('local', {
    player1: config.player1,
    player2: config.player2,
    time: config.time,
    size: config.size
  });
  currentScreen.value = 'game';
}

function startAIGame(config: { playerName: string; playerColor: Player; difficulty: Difficulty; size: number; time: number }) {
  gameStore.myColor = config.playerColor;
  gameStore.myName = config.playerName;
  gameStore.aiColor = (config.playerColor === 1 ? 2 : 1) as Player;

  const aiName = config.difficulty === 'easy' ? 'AI(简单)' : config.difficulty === 'medium' ? 'AI(中等)' : 'AI(困难)';

  gameStore.startGame('ai', {
    player1: config.playerColor === 1 ? config.playerName : aiName,
    player2: config.playerColor === 2 ? config.playerName : aiName,
    time: config.time,
    size: config.size
  });

  initAI(config.difficulty);
  gameStore.setOnAITurn(() => aiMakeMove());

  if (gameStore.aiColor === 1) {
    setTimeout(() => aiMakeMove(), 300);
  }

  currentScreen.value = 'game';
}

async function refreshRoomList() {
  if (!wsStore.connected) {
    try {
      await wsStore.connect();
      setupWSMessageHandler();
    } catch {
      showToast('连接服务器失败');
      return;
    }
  }
  wsStore.getRoomList();
}

function handleJoinRoom(data: { roomCode: string; hasPassword: boolean; nickname: string }) {
  gameStore.myName = data.nickname;
  gameStore.pendingRoomCode = data.roomCode;
  if (data.hasPassword) {
    panels.value.password = true;
  } else {
    doJoinRoom(data.roomCode, data.nickname);
  }
}

function handleJoinRoomByCode(data: { roomCode: string; nickname: string }) {
  gameStore.myName = data.nickname;
  gameStore.pendingRoomCode = data.roomCode;
  doJoinRoom(data.roomCode, data.nickname);
}

function submitPassword(password: string) {
  doJoinRoom(pendingRoomCode.value, gameStore.myName, password);
}

async function doJoinRoom(code: string, nickname: string, password?: string) {
  if (!wsStore.connected) {
    try {
      await wsStore.connect();
      setupWSMessageHandler();
    } catch {
      showToast('连接服务器失败');
      return;
    }
  }
  wsStore.joinRoom(code, nickname, password);
}

async function handleCreateRoom(config: { password: string; time: number; size: number; matchMode: MatchMode; undoLimit: number }) {
  if (!wsStore.connected) {
    try {
      await wsStore.connect();
      setupWSMessageHandler();
    } catch {
      showToast('连接服务器失败');
      return;
    }
  }
  createRoomPassword.value = config.password;
  wsStore.createRoom({
    password: config.password,
    time: config.time,
    size: config.size,
    matchMode: config.matchMode,
    undoLimit: config.undoLimit,
    nickname: gameStore.myName
  });
}

function cancelWaiting() {
  wsStore.leaveRoom();
  panels.value.waiting = false;
  gameStore.roomCode = '';
}

function handleUndo() {
  if (gameMode.value === 'online') {
    wsStore.requestUndo();
    showToast('已发送悔棋请求');
  } else {
    gameStore.undo();
  }
}

function handleSurrender() {
  if (!confirm('确定要认输吗？')) return;
  if (gameMode.value === 'online') {
    wsStore.surrender();
  } else {
    const winner = currentPlayer.value === 1 ? 2 : 1;
    gameStore.matchWins[winner as Player]++;
    gameStore.endGame(winner as Player);
  }
}

function handlePlayAgain() {
  if (gameMode.value === 'online') {
    wsStore.playAgain();
    isReady.value = true;
    readyStatusText.value = '已准备，等待对手...';
  } else if (gameMode.value === 'ai') {
    initAI(gameStore.aiDifficulty);
    gameStore.setOnAITurn(() => aiMakeMove());
    gameStore.swapColorsAndRestart();
    if (gameStore.aiColor === 1) {
      setTimeout(() => aiMakeMove(), 300);
    }
  } else {
    gameStore.swapColorsAndRestart();
  }
}

function handleExitRoom() {
  if (gameMode.value === 'online') {
    wsStore.leaveRoom();
    wsStore.disconnect();
  }
  gameStore.backToMenu();
  aiCleanup();
  currentScreen.value = 'menu';
  showWinModal.value = false;
  isReady.value = false;
}

function handleReady() {
  if (gameMode.value === 'online') {
    wsStore.playAgain();
    isReady.value = true;
    readyStatusText.value = '已准备，等待对手...';
  } else {
    showWinModal.value = false;
    handlePlayAgain();
  }
}

function handleQuickMsg(msg: string) {
  if (gameMode.value === 'online') {
    wsStore.sendQuickMsg(msg);
  }
}

function handleSendEmoji(emoji: string) {
  showEmojiPopup.value = false;
  if (gameMode.value !== 'online') return;
  wsStore.sendEmoji(emoji);
}

function acceptUndo() {
  wsStore.acceptUndo();
  showUndoRequest.value = false;
}

function rejectUndo() {
  wsStore.rejectUndo();
  showUndoRequest.value = false;
}

function exportGame() {
  gameStore.exportGame();
}

function setupWSMessageHandler() {
  wsStore.onMessage((data: any) => {
    switch (data.type) {
      case 'room_created':
        gameStore.roomCode = data.roomCode;
        gameStore.isHost = true;
        gameStore.myUserId = data.userId;
        panels.value.createRoom = false;
        panels.value.onlineSetup = false;
        panels.value.waiting = true;
        break;

      case 'room_joined':
        gameStore.roomCode = data.roomCode;
        gameStore.myColor = data.color;
        gameStore.myUserId = data.userId;
        gameStore.isHost = false;
        panels.value.onlineSetup = false;
        panels.value.password = false;
        break;

      case 'opponent_joined':
        gameStore.opponentName = data.opponentName;
        panels.value.waiting = false;
        gameStore.undoLimit = data.undoLimit || 3;
        gameStore.startGame('online', {
          player1: gameStore.myColor === 1 ? gameStore.myName : data.opponentName,
          player2: gameStore.myColor === 2 ? gameStore.myName : data.opponentName,
          time: data.time || 300,
          size: data.size || 15,
          matchMode: (data.matchMode || 1) as MatchMode
        });
        currentScreen.value = 'game';
        break;

      case 'piece_placed':
        gameStore.doPlacePiece(data.row, data.col, data.player as Player);
        if (data.currentPlayer) {
          gameStore.currentPlayer = data.currentPlayer as Player;
        }
        break;

      case 'game_over':
        if (data.winner) {
          gameStore.matchWins[data.winner as Player]++;
        }
        gameStore.endGame((data.winner || 0) as Player | 0);
        showWinModal.value = true;
        isReady.value = false;
        readyStatusText.value = '等待双方准备...';
        break;

      case 'opponent_left':
        showToast('对手已离开房间');
        break;

      case 'opponent_disconnected':
        showToast('对手已断线，等待重连...');
        break;

      case 'opponent_reconnected':
        showToast('对手已重连');
        break;

      case 'undo_request':
        showUndoRequest.value = true;
        undoRequestText.value = `${data.playerName || '对手'}请求悔棋，是否同意？`;
        break;

      case 'undo_accepted':
        gameStore.doUndo();
        showToast('悔棋成功');
        break;

      case 'undo_rejected':
        showToast('对手拒绝悔棋');
        break;

      case 'room_list':
        if (onlinePanelRef.value) {
          onlinePanelRef.value.updateRoomList(data.rooms || []);
        }
        break;

      case 'quick_msg':
        showToast(data.message || '');
        break;

      case 'emoji':
        showToast(data.emoji || '');
        break;

      case 'error':
        showToast(data.message || '发生错误');
        break;

      case 'pong':
        break;

      case 'room_expired':
        showToast('房间已过期');
        currentScreen.value = 'menu';
        break;

      case 'server_shutdown':
        showToast('服务器即将关闭');
        break;

      case 'play_again':
        gameStore.resetGame();
        isReady.value = false;
        showWinModal.value = false;
        readyStatusText.value = '等待双方准备...';
        break;
    }
  });
}

watch(() => gameStore.isAiTurn, (val) => {
  if (val && gameStore.isPlaying && !gameStore.isEnding) {
    setTimeout(() => {
      if (gameStore.isAiTurn && gameStore.isPlaying && !gameStore.isEnding) {
        aiMakeMove();
      }
    }, 300);
  }
});

watch(() => [gameStore.isPlaying, gameStore.isEnding, gameStore.winningLine], () => {
  if (!gameStore.isPlaying && !gameStore.isEnding && gameStore.winningLine.length > 0 && gameMode.value !== 'online') {
    showWinModal.value = true;
  }
}, { deep: true });

onMounted(() => {
  gameStore.setOnAITurn(() => aiMakeMove());
});

onUnmounted(() => {
  aiCleanup();
  wsStore.disconnect();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.game-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  padding: 6px 10px;
  overflow: hidden;
}

.score-display {
  text-align: center;
  color: #f39c12;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  padding: 4px 12px;
  background: rgba(243, 156, 18, 0.1);
  border-radius: 20px;
  flex-shrink: 0;
}

.match-info {
  color: #3498db;
}

@media (min-width: 768px) {
  .game-screen {
    padding: 10px 20px;
  }
  .score-display {
    font-size: 14px;
    margin-bottom: 8px;
    padding: 6px 16px;
  }
}
</style>
