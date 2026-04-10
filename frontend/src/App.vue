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
      <div v-if="matchMode > 1 || (gameMode === 'online' && !gameStore.isPlaying && gameStore.moveHistory.length > 0)" class="score-display">
        <span class="match-info">第 {{ currentRound }} 局</span>
        | 比分 {{ matchWins.myScore }} : {{ matchWins.opponentScore }}
      </div>

      <div v-if="boardReadyStatusVisible" class="board-ready-status" :style="{ color: readyStatusColor }">
        {{ readyStatusText }}
      </div>

      <PlayerInfo
        :player="players[opponentColor]"
        :color="opponentColor"
        :is-me="false"
        :is-current-turn="currentPlayer === opponentColor"
        :is-a-i-thinking="gameStore.isAiTurn && currentPlayer === opponentColor"
      />

      <GameBoard />

      <PlayerInfo
        :player="players[myColor]"
        :color="myColor"
        :is-me="true"
        :is-current-turn="currentPlayer === myColor"
        :is-a-i-thinking="gameStore.isAiTurn && currentPlayer === myColor"
      />

      <GameControls
        :game-state="gameStateForControls"
        :show-move-numbers="showMoveNumbers"
        :show-emoji-popup="showEmojiPopup"
        :is-ready="isReady"
        @undo="handleUndo"
        @surrender="handleSurrender"
        @play-again="handlePlayAgain"
        @ready="handleReady"
        @toggle-numbers="gameStore.showMoveNumbers = !gameStore.showMoveNumbers"
        @export-game="exportGame"
        @exit-room="handleExitRoom"
        @quick-msg="handleQuickMsg"
              @toggle-emoji="showEmojiPopup = !showEmojiPopup"
              @send-emoji="handleSendEmoji"
              @send-custom="handleSendCustom"      />
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
      :ready-status-color="readyStatusColor"
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

    <!-- 断线重连UI -->
    <div v-if="showReconnect" class="reconnect-overlay">
      <div class="reconnect-content">
        <div class="reconnect-icon">🔌</div>
        <h3>连接断开</h3>
        <p>正在尝试重新连接... ({{ reconnectAttempts }}/5)</p>
        <div class="reconnect-spinner"></div>
      </div>
    </div>
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
const showReconnect = ref(false);
const reconnectAttempts = ref(0);

const toastMessage = ref('');
const toastVisible = ref(false);
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const onlinePanelRef = ref<any>(null);
const createRoomPassword = ref('');
const isReady = ref(false);
const readyStatusText = ref('等待双方准备...');
const readyStatusColor = ref('#3498db');
const boardReadyStatusVisible = ref(false);
const opponentReady = ref(false);

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
const matchWins = computed(() => {
  // 按视角显示比分
  // matchWins[1] = 房主得分, matchWins[2] = 加入者得分
  if (gameStore.isHost) {
    return { myScore: gameStore.matchWins[1], opponentScore: gameStore.matchWins[2] };
  } else {
    return { myScore: gameStore.matchWins[2], opponentScore: gameStore.matchWins[1] };
  }
});
const currentRound = computed(() => gameStore.currentRound);
const gameMode = computed(() => gameStore.gameMode);
const showMoveNumbers = computed(() => gameStore.showMoveNumbers);
const roomCode = computed(() => gameStore.roomCode);
const pendingRoomCode = computed(() => gameStore.pendingRoomCode);

const matchResultText = computed(() => {
  const steps = gameStore.moveHistory.length;
  if (matchMode.value === 1) return `本局: ${steps} 步`;
  const targetWins = Math.ceil(matchMode.value / 2);
  if (gameStore.matchEnded) {
    const myWin = matchWins.value.myScore >= targetWins;
    const opponentWin = matchWins.value.opponentScore >= targetWins;
    if (myWin) {
      return `本局: ${steps} 步 | 你赢了比赛!`;
    } else if (opponentWin) {
      return `本局: ${steps} 步 | ${gameStore.opponentName} 赢得比赛!`;
    }
  }
  return `本局: ${steps} 步 | 比分 ${matchWins.value.myScore}:${matchWins.value.opponentScore}`;
});

const readyButtonText = computed(() => {
  if (isReady.value) return '已准备 ✓';
  if (gameMode.value === 'online') {
    return gameStore.matchEnded ? '再赛一轮' : '下一局';
  }
  return '再来一局';
});

const winnerName = computed(() => {
  if (gameStore.winningLine.length === 0 && gameStore.moveHistory.length === boardSize.value * boardSize.value) return '平局';
  if (gameStore.winningLine.length === 0) return '';
  const winner = gameStore.moveHistory.length > 0 ? gameStore.moveHistory[gameStore.moveHistory.length - 1].player : 0;
  if (winner === 0) return '平局';
  return players.value[winner as Player]?.name || '未知';
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
  pieceSize: gameStore.pieceSize,
  chatMessages: gameStore.chatMessages || [],
  opponentReady: opponentReady.value
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

function showCreateRoom(data: { nickname: string }) {
  gameStore.myName = data.nickname;
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
  gameStore.undoLimit = 999;

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
    readyStatusColor.value = '#2ecc71';
    boardReadyStatusVisible.value = true;
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
    wsStore.clearRoomInfo(); // 清理房间信息
  }
  gameStore.backToMenu();
  aiCleanup();
  currentScreen.value = 'menu';
  showWinModal.value = false;
  isReady.value = false;
  opponentReady.value = false;
  boardReadyStatusVisible.value = false;
  readyStatusText.value = '等待双方准备...';
  readyStatusColor.value = '#3498db';
}

function handleReady() {
  if (gameMode.value === 'online') {
    wsStore.playAgain();
    isReady.value = true;
    readyStatusText.value = '已准备，等待对手...';
    readyStatusColor.value = '#2ecc71';
  } else {
    showWinModal.value = false;
    handlePlayAgain();
  }
}

function handleQuickMsg(msg: string) {
  if (gameMode.value === 'online') {
    gameStore.addChatMessage(msg, 'me', 'text');
    wsStore.sendQuickMsg(msg);
  }
}

function handleSendEmoji(emoji: string) {
  showEmojiPopup.value = false;
  if (gameMode.value !== 'online') return;
  gameStore.addChatMessage(emoji, 'me', 'emoji');
  wsStore.sendEmoji(emoji);
}

function handleSendCustom(message: string) {
  if (gameMode.value !== 'online') return;
  if (!message.trim()) return;
  gameStore.addChatMessage(message, 'me', 'text');
  wsStore.sendQuickMsg(message);
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
        gameStore.myColor = 1; // 房主是黑棋
        gameStore.isHost = true;
        gameStore.myUserId = data.userId;
        wsStore.saveRoomInfo(data.roomCode, gameStore.myName, data.userId, true, 1);
        panels.value.createRoom = false;
        panels.value.onlineSetup = false;
        panels.value.waiting = true;
        break;

      case 'room_joined':
        gameStore.roomCode = data.roomCode;
        gameStore.myColor = data.color;
        gameStore.myUserId = data.userId;
        gameStore.isHost = false;
        wsStore.saveRoomInfo(data.roomCode, gameStore.myName, data.userId, false, data.color);
        panels.value.onlineSetup = false;
        panels.value.password = false;

        // 如果已经有对手（房间已满），直接开始游戏
        if (data.opponent) {
          const opponentName = data.opponent?.name || '对手';
          gameStore.opponentName = opponentName;
          gameStore.undoLimit = data.undoLimit || 3;
          gameStore.startGame('online', {
            player1: gameStore.myColor === 1 ? gameStore.myName : opponentName,
            player2: gameStore.myColor === 2 ? gameStore.myName : opponentName,
            time: data.time || 300,
            size: data.size || 15,
            matchMode: (data.matchMode || 1) as MatchMode
          });
          currentScreen.value = 'game';
        } else {
          // 否则显示等待面板
          panels.value.waiting = true;
        }
        break;

      case 'opponent_joined':
        // 服务器发送的是整个 opponent 对象
        const opponentName = data.opponent?.name || data.opponentName || '对手';
        gameStore.opponentName = opponentName;
        panels.value.waiting = false;
        gameStore.undoLimit = data.undoLimit || 3;
        gameStore.startGame('online', {
          player1: gameStore.myColor === 1 ? gameStore.myName : opponentName,
          player2: gameStore.myColor === 2 ? gameStore.myName : opponentName,
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
        if (data.players) {
          data.players.forEach((p: any) => {
            if (p) {
              gameStore.players[p.color].time = p.time;
              gameStore.players[p.color].moves = p.moves;
              gameStore.players[p.color].undoLeft = p.undoLeft;
            }
          });
        }
        break;

      case 'game_over':
        if (data.matchWins) {
          gameStore.matchWins = data.matchWins;
        }
        if (data.winningMove) {
          const wr = data.winningMove.row;
          const wc = data.winningMove.col;
          gameStore.doPlacePiece(wr, wc, data.winner as Player);
        }
        gameStore.endGame((data.winner || 0) as Player | 0);
        showWinModal.value = true;
        isReady.value = false;
        opponentReady.value = false;
        readyStatusText.value = '等待双方准备...';
        readyStatusColor.value = '#3498db';
        boardReadyStatusVisible.value = true;

        // 检查比赛是否结束，如果结束则清理房间信息
        if (gameStore.matchWins[1] >= Math.ceil(gameStore.matchMode / 2) || gameStore.matchWins[2] >= Math.ceil(gameStore.matchMode / 2)) {
          wsStore.clearRoomInfo();
        }
        break;

      case 'time_sync':
        if (data.players) {
          data.players.forEach((p: any) => {
            if (p) {
              gameStore.players[p.color].time = p.time;
            }
          });
        }
        if (data.currentPlayer) {
          gameStore.currentPlayer = data.currentPlayer as Player;
        }
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

      case 'rejoined':
        // 隐藏断线重连UI
        showReconnect.value = false;

        // 恢复棋盘状态
        if (data.board) {
          gameStore.board = data.board;
        }
        if (data.currentPlayer) {
          gameStore.currentPlayer = data.currentPlayer as Player;
        }
        if (data.moves) {
          gameStore.moveHistory = data.moves as Move[];
        }

        // 恢复自己的颜色（重要！）
        if (data.color !== undefined) {
          gameStore.myColor = data.color as Player;
        }

        // 恢复玩家信息
        if (data.players) {
          data.players.forEach((p: any) => {
            if (p) {
              gameStore.players[p.color] = {
                name: p.name,
                time: p.time,
                moves: p.moves || 0,
                undoLeft: p.undoLeft || gameStore.undoLimit
              };
              // 更新自己的userId
              if (p.name === gameStore.myName) {
                gameStore.myUserId = p.id;
              }
            }
          });
        }

        // 更新房间信息
        if (wsStore.savedRoomInfo) {
          wsStore.saveRoomInfo(
            wsStore.savedRoomInfo.roomCode,
            gameStore.myName,
            gameStore.myUserId,
            wsStore.savedRoomInfo.isHost,
            gameStore.myColor
          );
        }

        showToast('重连成功，已恢复游戏状态');
        break;

      case 'undo_request':
        showUndoRequest.value = true;
        undoRequestText.value = `${data.playerName || '对手'}请求悔棋，是否同意？`;
        break;

      case 'undo_accepted':
        gameStore.doUndo();
        if (data.players) {
          data.players.forEach((p: any) => {
            if (p) {
              gameStore.players[p.color].undoLeft = p.undoLeft;
            }
          });
        }
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
        gameStore.addChatMessage(data.message || '', 'opponent', 'text');
        showToast(`${data.playerName || '对手'}: ${data.message || ''}`);
        break;

      case 'emoji':
        gameStore.addChatMessage(data.emoji || '', 'opponent', 'emoji');
        showToast(`${data.playerColor === gameStore.myColor ? '你' : '对手'}: ${data.emoji || ''}`);
        break;

      case 'error':
        showToast(data.message || '发生错误');
        // 如果是房间不存在错误，清理房间信息
        if (data.message?.includes('房间不存在') || data.message?.includes('未找到玩家')) {
          wsStore.clearRoomInfo();
        }
        break;

      case 'pong':
        break;

      case 'room_expired':
        showToast('房间已过期');
        wsStore.clearRoomInfo();
        currentScreen.value = 'menu';
        break;

      case 'server_shutdown':
        showToast('服务器即将关闭');
        break;

      case 'play_again_status':
        if (data.matchWins) {
          gameStore.matchWins = data.matchWins;
        }
        if (data.currentRound) {
          gameStore.currentRound = data.currentRound;
        }

        gameStore.matchEnded = gameStore.matchWins[1] >= Math.ceil(gameStore.matchMode / 2) || gameStore.matchWins[2] >= Math.ceil(gameStore.matchMode / 2);

        const myIdx = gameStore.myPlayerIndex !== undefined ? gameStore.myPlayerIndex : (gameStore.myColor - 1);
        const oppIdx = myIdx === 0 ? 1 : 0;
        const myReadyStatus = data.ready ? data.ready[myIdx] : false;
        const oppReadyStatus = data.ready ? data.ready[oppIdx] : false;

        opponentReady.value = oppReadyStatus;

        if (myReadyStatus && oppReadyStatus) {
          readyStatusText.value = '双方已准备，即将开始...';
          readyStatusColor.value = '#2ecc71';
        } else if (oppReadyStatus) {
          readyStatusText.value = '对手已准备，等你确认';
          readyStatusColor.value = '#f39c12';
        } else {
          readyStatusText.value = '等待双方准备...';
          readyStatusColor.value = '#3498db';
        }
        break;

      case 'play_again':
        if (data.matchMode) {
          gameStore.matchMode = data.matchMode;
        }
        if (data.currentRound) {
          gameStore.currentRound = data.currentRound;
        }
        if (data.matchWins) {
          gameStore.matchWins = data.matchWins;
        }
        if (data.players) {
          const myPlayer = data.players.find((p: any) => p && p.id === gameStore.myUserId);
          if (myPlayer) {
            gameStore.myColor = myPlayer.color;
            gameStore.myPlayerIndex = data.players.indexOf(myPlayer);
            gameStore.myName = myPlayer.name; // 更新自己的名字
            const opponent = data.players.find((p: any) => p && p.color !== myPlayer.color);
            if (opponent) {
              gameStore.opponentName = opponent.name;
            }
          }
          data.players.forEach((p: any) => {
            if (p) {
              gameStore.players[p.color] = {
                name: p.name,
                time: p.time,
                moves: p.moves || 0,
                undoLeft: p.undoLeft || gameStore.undoLimit
              };
            }
          });
        }
        gameStore.resetGame();
        isReady.value = false;
        opponentReady.value = false;
        showWinModal.value = false;
        boardReadyStatusVisible.value = false;
        readyStatusText.value = '等待双方准备...';
        readyStatusColor.value = '#3498db';
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
  if (!gameStore.isPlaying && !gameStore.isEnding && gameStore.winningLine.length > 0) {
    showWinModal.value = true;
  }
}, { deep: true });

onMounted(() => {
  gameStore.setOnAITurn(() => aiMakeMove());

  // 检查URL参数，自动加入房间
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  const password = urlParams.get('pwd');

  if (roomCode) {
    // 自动打开在线对战面板并加入房间
    showOnlineSetup();
    // 设置房间码和密码
    gameStore.pendingRoomCode = roomCode;
    gameStore.myName = '玩家'; // 使用默认名称

    // 如果有密码，显示密码输入面板
    if (password) {
      panels.value.password = true;
    } else {
      // 直接尝试加入房间
      setTimeout(() => {
        doJoinRoom(roomCode, '玩家');
      }, 100);
    }
  }

  // 检查是否有保存的房间信息（断线重连）
  const savedRoom = wsStore.loadRoomInfo();
  if (savedRoom && gameMode.value === 'online') {
    // 恢复自己的颜色
    if (savedRoom.myColor !== undefined) {
      gameStore.myColor = savedRoom.myColor as Player;
    }
    // 恢复是否房主
    if (savedRoom.isHost !== undefined) {
      gameStore.isHost = savedRoom.isHost;
    }
    // 尝试自动重连
    wsStore.autoReconnect();
  }
});

// 监听WebSocket连接状态
watch(() => wsStore.connected, (connected) => {
  if (!connected && gameMode.value === 'online' && gameStore.isPlaying) {
    // 在线模式下断线，显示重连UI
    showReconnect.value = true;
    reconnectAttempts.value = wsStore.reconnectAttempts;
  } else if (connected) {
    // 连接成功，隐藏重连UI
    showReconnect.value = false;
  }
});

// 监听重连次数
watch(() => wsStore.reconnectAttempts, (attempts) => {
  reconnectAttempts.value = attempts;
});

onUnmounted(() => {
  aiCleanup();
  wsStore.disconnect();
  wsStore.clearRoomInfo(); // 清理房间信息
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
  gap: 4px;
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

.board-ready-status {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 2px;
  padding: 2px 10px;
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.match-info {
  color: #3498db;
}

.reconnect-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.reconnect-content {
  background: #2c3e50;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  border: 2px solid #e74c3c;
}

.reconnect-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.reconnect-content h3 {
  color: #fff;
  margin-bottom: 10px;
  font-size: 20px;
}

.reconnect-content p {
  color: #aaa;
  margin-bottom: 20px;
  font-size: 14px;
}

.reconnect-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(231, 76, 60, 0.3);
  border-top: 4px solid #e74c3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 移动端优化 */
@media (max-width: 767px) {
  .game-screen {
    padding: 4px 8px;
    gap: 2px;
  }
  .score-display {
    font-size: 11px;
    margin-bottom: 2px;
    padding: 3px 8px;
  }
  .board-ready-status {
    font-size: 10px;
    margin-bottom: 1px;
    padding: 2px 8px;
  }
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
