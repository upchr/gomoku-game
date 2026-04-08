/**
 * 游戏类型定义
 */

export type Player = 1 | 2;  // 1=黑, 2=白
export type GameMode = 'local' | 'ai' | 'online';
export type MatchMode = 1 | 3 | 5;  // 单局/三局两胜/五局三胜
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
  previewCell: { row: number; col: number } | null;
  undoRequested: boolean;
  matchMode: MatchMode;
  matchWins: Record<Player, number>;
  currentRound: number;
  undoLimit: number;
  winningLine: number[];
  aiColor: Player | null;
  aiDifficulty: Difficulty;
  showMoveNumbers: boolean;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
