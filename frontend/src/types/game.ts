export type Player = 1 | 2;
export type GameMode = 'local' | 'ai' | 'online';
export type MatchMode = 1 | 3 | 5;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Move {
  row: number;
  col: number;
  player: Player;
  timestamp: number;
}

export interface PlayerInfo {
  name: string;
  time: number;
  moves: number;
  undoLeft: number;
}

export interface GameHistory {
  date: string;
  player1: string;
  player2: string;
  winner: string;
  moves: number;
  mode: GameMode;
}

export interface Room {
  code: string;
  hostName: string;
  hasPassword: boolean;
  matchMode: number;
  boardSize: number;
  gameTime: number;
}

export interface WinResult {
  row: number;
  col: number;
}

export interface GameState {
  board: number[][];
  boardSize: number;
  currentPlayer: Player;
  players: Record<Player, PlayerInfo>;
  gameTime: number;
  gameMode: GameMode;
  isPlaying: boolean;
  isEnding: boolean;
  startTime: number | null;
  moveHistory: Move[];
  myColor: Player;
  myName: string;
  roomCode: string;
  pendingRoomCode: string;
  previewCell: { row: number; col: number } | null;
  undoRequested: boolean;
  matchMode: MatchMode;
  matchWins: Record<Player, number>;
  currentRound: number;
  undoLimit: number;
  winningLine: WinResult[];
  aiColor: Player | null;
  aiDifficulty: Difficulty;
  showMoveNumbers: boolean;
  matchEnded: boolean;
  isHost: boolean;
  myUserId: string;
  myPlayerIndex: number;
  opponentName: string;
  boardScale: number;
  pieceSize: number;
  opponentReady: boolean;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface LocalGameConfig {
  player1: string;
  player2: string;
  time: number;
  size: number;
  undoLimit: number;
}

export interface AIGameConfig {
  playerName: string;
  playerColor: Player;
  difficulty: Difficulty;
  size: number;
  time: number;
}

export interface CreateRoomConfig {
  password: string;
  time: number;
  size: number;
  matchMode: MatchMode;
  undoLimit: number;
}

export interface JoinRoomData {
  roomCode: string;
  hasPassword: boolean;
  nickname: string;
}

export interface JoinRoomByCodeData {
  roomCode: string;
  nickname: string;
}
