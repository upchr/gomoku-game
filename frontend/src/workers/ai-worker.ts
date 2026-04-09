/**
 * 五子棋 AI Web Worker
 * 在后台线程运行 AI 计算，避免阻塞 UI
 */

import { GomokuAI } from './ai';

// 定义消息类型
interface WorkerRequest {
  requestId: number;
  board: number[][];
  player: 1 | 2;
  difficulty: 'easy' | 'medium' | 'hard';
  boardSize: number;
  timeLimit: number;
}

interface WorkerResponse {
  requestId: number;
  success: boolean;
  move: { row: number; col: number } | null;
  thinkTime: number;
  error?: string;
}

// 接收主线程消息
self.onmessage = function(e: MessageEvent<WorkerRequest>) {
  const { requestId, board, player, difficulty, boardSize, timeLimit } = e.data;

  try {
    // 创建 AI 实例
    const ai = new GomokuAI(difficulty, boardSize);

    // 获取最佳走法
    const startTime = Date.now();
    const result = ai.getBestMove(board, player, timeLimit);
    const thinkTime = Date.now() - startTime;

    // 返回结果（包含请求 ID）
    const response: WorkerResponse = {
      requestId: requestId,
      success: true,
      move: result,
      thinkTime: thinkTime
    };
    self.postMessage(response);
  } catch (err) {
    // 返回错误（包含请求 ID）
    const response: WorkerResponse = {
      requestId: requestId,
      success: false,
      move: null,
      thinkTime: 0,
      error: err instanceof Error ? err.message : String(err)
    };
    self.postMessage(response);
  }
};

// 声明 worker 自身的类型
declare const self: DedicatedWorkerGlobalScope;
export {};