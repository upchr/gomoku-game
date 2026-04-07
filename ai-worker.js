/**
 * 五子棋 AI Web Worker
 * 在后台线程运行 AI 计算，避免阻塞 UI
 */

// 导入 AI 引擎代码
importScripts('ai.js');

// 接收主线程消息
self.onmessage = function(e) {
  const { requestId, board, player, difficulty, boardSize, timeLimit } = e.data;
  
  try {
    // 创建 AI 实例
    const ai = new GomokuAI(difficulty, boardSize);
    
    // 获取最佳走法
    const startTime = Date.now();
    const result = ai.getBestMove(board, player, timeLimit);
    const thinkTime = Date.now() - startTime;
    
    // 返回结果（包含请求 ID）
    self.postMessage({
      requestId: requestId,
      success: true,
      move: result,
      thinkTime: thinkTime
    });
  } catch (err) {
    // 返回错误（包含请求 ID）
    self.postMessage({
      requestId: requestId,
      success: false,
      error: err.message
    });
  }
};
