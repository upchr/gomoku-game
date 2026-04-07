/**
 * 五子棋 AI 引擎
 * 算法：Alpha-Beta 剪枝 + 迭代加深 + PVS（主变搜索）
 * 优化：Zobrist 置换表、历史启发、候选点剪枝
 * 纯 Vanilla JS 实现，无外部依赖
 */

class GomokuAI {
  constructor(difficulty = 'medium', boardSize = 15) {
    this.difficulty = difficulty;
    this.size = boardSize;
    
    // 根据棋盘大小和难度设置参数
    this.depthConfig = this.getDepthConfig(difficulty, boardSize);
    this.timeLimitConfig = this.getTimeLimitConfig(difficulty, boardSize);
    
    // 初始化 Zobrist 哈希表
    this.zobrist = this.initZobrist();
    
    // 置换表（限制 50MB）
    this.transpositionTable = new Map();
    this.maxTableSize = 500000; // 约 50MB
    
    // 历史启发表（用于走法排序）
    this.historyTable = this.createArray2D(0);
    
    // 搜索控制
    this.nodeCount = 0;
    this.startTime = 0;
    this.timeLimit = 100;
    this.tableAge = 0;
    
    // 搜索统计
    this.searchStats = {
      nodes: 0,
      cutoffs: 0,
      cacheHits: 0,
      cacheMisses: 0,
      evaluations: 0
    };
    
    // 位置权重矩阵（中心权重更高）
    this.positionWeight = this.createPositionWeight();
    
    // 棋型评分
    this.patternScores = {
      FIVE: 10000000,      // 连五
      LIVE_FOUR: 1000000,  // 活四（提高权重）
      RUSH_FOUR: 100000,   // 冲四（提高权重）
      LIVE_THREE: 10000,   // 活三（提高权重）
      SLEEP_THREE: 1000,   // 眠三（提高权重）
      LIVE_TWO: 500,       // 活二（提高权重）
      SLEEP_TWO: 100       // 眠二（提高权重）
    };
    
    // 基于难度的防守权重倍数
    this.defenseMultiplier = this.getDefenseMultiplier(difficulty);
    
    // 方向数组（四个方向）
    this.directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    
    // 开局库（前几步的定式走法）
    this.openingBook = this.initOpeningBook();
    
    // 暴露 depthMap 供前端读取
    this.depthMap = {
      'easy': { timeLimit: this.getTimeLimitConfig('easy', boardSize) },
      'medium': { timeLimit: this.getTimeLimitConfig('medium', boardSize) },
      'hard': { timeLimit: this.getTimeLimitConfig('hard', boardSize) }
    };
  }
  
  // 根据难度获取防守权重倍数
  getDefenseMultiplier(difficulty) {
    // 简单：防守权重较低，更注重进攻
    // 中等：攻守平衡
    // 困难：防守权重较高，更注重防守
    const multiplierMap = {
      'easy': 0.8,
      'medium': 1.0,
      'hard': 1.2
    };
    return multiplierMap[difficulty] || 1.0;
  }
  
  // 计算当前局势（返回优势/劣势评分）
  evaluateSituation(board, player) {
    let myScore = 0;
    let opponentScore = 0;
    const opponent = 3 - player;
    
    // 统计双方的高威胁棋型
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] === player) {
          const score = this.evaluatePoint(board, i, j, player);
          myScore += score;
        } else if (board[i][j] === opponent) {
          const score = this.evaluatePoint(board, i, j, opponent);
          opponentScore += score;
        }
      }
    }
    
    // 计算优势差值（正数表示优势，负数表示劣势）
    const advantage = myScore - opponentScore;
    
    // 计算优势比例（-1 到 1 之间）
    const totalScore = Math.abs(myScore) + Math.abs(opponentScore) + 1;
    const advantageRatio = advantage / totalScore;
    
    return {
      advantage,
      advantageRatio,
      myScore,
      opponentScore
    };
  }
  
  // 根据局势动态调整防守权重
  getDynamicDefenseMultiplier(board, player) {
    const situation = this.evaluateSituation(board, player);
    const complexity = this.countPieces(board) / (this.size * this.size);
    
    let dynamicMultiplier = this.defenseMultiplier;
    
    // 根据优势调整
    if (situation.advantageRatio > 0.3) {
      // 明显优势：降低防守权重，加强进攻
      dynamicMultiplier *= 0.7;
      console.log('AI: 明显优势，加强进攻', { advantageRatio: situation.advantageRatio.toFixed(2) });
    } else if (situation.advantageRatio > 0.1) {
      // 轻微优势：略微降低防守权重
      dynamicMultiplier *= 0.9;
      console.log('AI: 轻微优势，偏向进攻', { advantageRatio: situation.advantageRatio.toFixed(2) });
    } else if (situation.advantageRatio < -0.3) {
      // 明显劣势：大幅提高防守权重，加强防守
      dynamicMultiplier *= 1.5;
      console.log('AI: 明显劣势，加强防守', { advantageRatio: situation.advantageRatio.toFixed(2) });
    } else if (situation.advantageRatio < -0.1) {
      // 轻微劣势：略微提高防守权重
      dynamicMultiplier *= 1.2;
      console.log('AI: 轻微劣势，偏向防守', { advantageRatio: situation.advantageRatio.toFixed(2) });
    }
    
    // 根据游戏阶段调整
    if (complexity > 0.8) {
      // 终局阶段：进一步提高防守权重
      dynamicMultiplier *= 1.2;
      console.log('AI: 终局阶段，提高防守权重');
    } else if (complexity < 0.2) {
      // 开局阶段：略微降低防守权重
      dynamicMultiplier *= 0.9;
      console.log('AI: 开局阶段，降低防守权重');
    }
    
    return dynamicMultiplier;
  }
  
  // 根据棋盘大小和难度获取搜索深度配置
  getDepthConfig(difficulty, boardSize) {
    // 小棋盘分支因子小，可以搜索更深
    // 大棋盘分支因子大，需要限制深度
    const depthMap = {
      13: {
        'easy': { min: 3, max: 4 },
        'medium': { min: 5, max: 6 },
        'hard': { min: 7, max: 8 }
      },
      15: {
        'easy': { min: 2, max: 3 },
        'medium': { min: 4, max: 5 },
        'hard': { min: 6, max: 7 }
      },
      19: {
        'easy': { min: 2, max: 3 },
        'medium': { min: 3, max: 4 },
        'hard': { min: 4, max: 5 }
      }
    };
    return depthMap[boardSize]?.[difficulty] || depthMap[15][difficulty];
  }
  
  // 根据棋盘大小和难度获取时间限制
  getTimeLimitConfig(difficulty, boardSize) {
    // 大棋盘需要更多思考时间
    const timeMap = {
      13: {
        'easy': 300,
        'medium': 600,
        'hard': 1200
      },
      15: {
        'easy': 400,
        'medium': 800,
        'hard': 1500
      },
      19: {
        'easy': 500,
        'medium': 1000,
        'hard': 2000
      }
    };
    return timeMap[boardSize]?.[difficulty] || timeMap[15][difficulty];
  }
  
  // 初始化开局库
  initOpeningBook() {
    return {
      // 空棋盘，下天元
      'empty': { row: 7, col: 7 },
      
      // 对手下天元后的应对（根据棋盘大小调整）
      'center_response': {
        13: [
          { row: 6, col: 6 }, { row: 6, col: 7 }, { row: 7, col: 6 }, { row: 8, col: 7 }, { row: 7, col: 8 }
        ],
        15: [
          { row: 8, col: 6 }, { row: 6, col: 8 }, { row: 8, col: 8 }, { row: 6, col: 6 }, { row: 7, col: 8 }
        ],
        19: [
          { row: 9, col: 9 }, { row: 9, col: 8 }, { row: 8, col: 9 }, { row: 10, col: 9 }, { row: 9, col: 10 }
        ]
      },
      
      // 花月定式（斜向开局）
      'huayue': [
        [[7,7], [6,8], [8,6]], // 序列1
        [[7,7], [8,8], [6,6]], // 序列2
        [[7,7], [8,6], [9,5]], // 序列3（扩展）
        [[7,7], [6,8], [5,9]]  // 序列4（扩展）
      ],
      
      // 浦月定式（直指开局）
      'puyue': [
        [[7,7], [7,8], [7,6]],     // 序列1
        [[7,7], [8,7], [9,7]],     // 序列2（扩展）
        [[7,7], [6,7], [5,7]]      // 序列3（扩展）
      ],
      
      // 云月定式
      'yunyue': [
        [[7,7], [8,7], [8,8]],     // 序列1
        [[7,7], [6,7], [6,6]]      // 序列2
      ]
    };
  }
  
  // 检查是否可以使用开局库
  checkOpeningBook(board, player) {
    const totalPieces = this.countPieces(board);
    
    // 空棋盘，下天元
    if (totalPieces === 0) {
      return this.openingBook.empty;
    }
    
    // 只有1颗棋子（对手下了天元）
    if (totalPieces === 1) {
      const center = Math.floor(this.size / 2);
      if (board[center][center] !== 0) {
        const responses = this.openingBook.center_response[this.size] || 
                          this.openingBook.center_response[15];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // 开局阶段（前10步），尝试找定式，但要先检查威胁
    if (totalPieces < 10) {
      const opponent = 3 - player;
      
      // 优先检查对手的威胁（活四、冲四、活三）
      const candidates = this.getCandidateMoves(board);
      for (const move of candidates) {
        // 检查对手在这个位置的威胁
        board[move.row][move.col] = opponent;
        const opponentScore = this.evaluatePoint(board, move.row, move.col, opponent);
        board[move.row][move.col] = 0;
        
        // 如果对手有活四或冲四，必须防守
        if (opponentScore >= this.patternScores.LIVE_FOUR) {
          console.log('AI: 开局检测到对手活四，紧急防守', move);
          return move;
        }
        // 如果对手有活三，也需要防守
        if (opponentScore >= this.patternScores.LIVE_THREE) {
          console.log('AI: 开局检测到对手活三，防守', move);
          return move;
        }
      }
      
      // 如果没有威胁，尝试使用定式
      const bookMove = this.findBookMove(board, player);
      if (bookMove) {
        console.log('AI: 使用开局定式', bookMove);
        return bookMove;
      }
    }
    
    return null;
  }
  
  // 查找定式走法
  findBookMove(board, player) {
    // 简单实现：如果有成双三或活四机会，优先下
    // 这里可以扩展更复杂的定式识别
    const candidates = this.getCandidateMoves(board);
    for (const move of candidates) {
      const score = this.quickEvaluate(board, move.row, move.col, player);
      if (score >= this.patternScores.LIVE_FOUR) {
        return move;
      }
    }
    return null;
  }
  
  // 快速评估（用于开局库）
  quickEvaluate(board, row, col, player) {
    return this.evaluatePoint(board, row, col, player);
  }
  
  // 统计棋子数量
  countPieces(board) {
    let count = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] !== 0) count++;
      }
    }
    return count;
  }
  
  // 创建二维数组
  createArray2D(fill = 0) {
    const arr = [];
    for (let i = 0; i < this.size; i++) {
      arr[i] = new Array(this.size).fill(fill);
    }
    return arr;
  }
  
  // 初始化 Zobrist 哈希表
  initZobrist() {
    const table = [];
    for (let i = 0; i < this.size; i++) {
      table[i] = [];
      for (let j = 0; j < this.size; j++) {
        table[i][j] = [0n, this.randomBigInt(), this.randomBigInt()];
      }
    }
    return table;
  }
  
  // 生成随机 64 位大整数
  randomBigInt() {
    const arr = new Uint32Array(2);
    // 使用 crypto API（浏览器/Node.js 通用）
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
    } else {
      // 降级方案
      arr[0] = Math.floor(Math.random() * 0xFFFFFFFF);
      arr[1] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    return (BigInt(arr[0]) << 32n) | BigInt(arr[1]);
  }
  
  // 创建位置权重矩阵
  createPositionWeight() {
    const weight = [];
    const center = Math.floor(this.size / 2);
    for (let i = 0; i < this.size; i++) {
      weight[i] = [];
      for (let j = 0; j < this.size; j++) {
        // 曼哈顿距离到中心的距离
        const dist = Math.abs(i - center) + Math.abs(j - center);
        weight[i][j] = Math.max(1, 15 - dist);
      }
    }
    return weight;
  }
  
  // ========== 公开接口 ==========
  
  /**
   * 获取最佳走法
   * @param {number[][]} board - 15x15 棋盘，0=空，1=黑，2=白
   * @param {number} player - 当前玩家，1=黑，2=白
   * @param {number} timeLimit - 时间限制（毫秒），可选
   * @returns {{row: number, col: number}} - 最佳走法
   */
  getBestMove(board, player, timeLimit = null) {
    // 输入验证
    if (!board || !Array.isArray(board) || board.length === 0) {
      throw new Error('Invalid board: board is null or empty');
    }
    if (player !== 1 && player !== 2) {
      throw new Error('Invalid player: must be 1 or 2');
    }
    if (board.length !== this.size || board[0].length !== this.size) {
      throw new Error(`Invalid board size: expected ${this.size}x${this.size}`);
    }
    
    // 检查棋盘是否已满
    const pieceCount = this.countPieces(board);
    const complexity = pieceCount / (this.size * this.size);  // 0 到 1 之间
    
    if (pieceCount >= this.size * this.size) {
      console.log('AI: 棋盘已满，无法落子');
      return null;
    }
    
    // 初始化搜索统计
    this.searchStats = {
      nodes: 0,
      cutoffs: 0,
      cacheHits: 0,
      cacheMisses: 0,
      evaluations: 0,
      pieceCount: pieceCount,
      complexity: complexity
    };
    
    try {
    // 动态调整时间限制：开局和终局给更多时间，中局给较少时间
    let adjustedTimeLimit = timeLimit || this.timeLimitConfig || 1000;
    
    if (complexity < 0.1) {
      // 开局阶段（棋子少于10%）：标准时间
      adjustedTimeLimit = adjustedTimeLimit;
    } else if (complexity < 0.25) {
      // 早期（10%-25%）：增加30%时间
      adjustedTimeLimit = Math.floor(adjustedTimeLimit * 1.3);
    } else if (complexity < 0.6) {
      // 中期（25%-60%）：减少20%时间
      adjustedTimeLimit = Math.floor(adjustedTimeLimit * 0.8);
    } else if (complexity < 0.8) {
      // 中后期（60%-80%）：增加30%时间
      adjustedTimeLimit = Math.floor(adjustedTimeLimit * 1.3);
    } else {
      // 终局（80%+）：增加50%时间
      adjustedTimeLimit = Math.floor(adjustedTimeLimit * 1.5);
    }
    
    this.timeLimit = adjustedTimeLimit;
    this.startTime = Date.now();
    this.nodeCount = 0;
    this.tableAge++;
    
    // 清理过旧的置换表项
    if (this.transpositionTable.size > this.maxTableSize) {
      this.cleanTranspositionTable();
    }
    
    // 重置历史启发表
    this.historyTable = this.createArray2D(0);
    
    // 检查开局库（前10步）
    const bookMove = this.checkOpeningBook(board, player);
    if (bookMove) {
      console.log('AI: 使用开局库', bookMove);
      return bookMove;
    }
    
    // 终局优化：棋子超过70%时，使用更深搜索
    if (complexity > 0.7) {
      this.depthConfig.max += 1;
      console.log('AI: 终局阶段，增加搜索深度', { newMax: this.depthConfig.max });
    }
    
    // 调试：检查对手威胁
    const opponent = 3 - player;
    const opponentThreats = this.checkThreats(board, opponent);
    if (opponentThreats.length > 0) {
      console.log('AI: 检测到对手威胁', opponentThreats);
    }
    
    let bestMove = null;
    let bestScore = -Infinity;
    
    // 迭代加深搜索
    for (let depth = 2; depth <= this.depthConfig.max; depth += 2) {
      if (Date.now() - this.startTime > this.timeLimit * 0.7) {
        break;
      }
      
      const result = this.searchRoot(board, player, depth);
      
      if (result && result.move) {
        bestMove = result.move;
        bestScore = result.score;
        
        // 找到必胜走法，直接返回
        if (bestScore >= this.patternScores.FIVE) {
          break;
        }
      }
      
      // 达到配置的最大深度
      if (depth >= this.depthConfig.max) {
        break;
      }
    }
    
    // 添加随机性：只在以下条件满足时才考虑随机选择
    // 1. 非开局阶段（complexity > 0.15）
    // 2. 非终局阶段（complexity < 0.75）
    // 3. 非紧急情况（bestScore < 活四）
    // 4. 非困难难度（困难模式不启用随机性）
    // 5. 优势不明显（|advantageRatio| < 0.2）
    if (bestMove && complexity > 0.15 && complexity < 0.75 && 
        bestScore < this.patternScores.LIVE_FOUR && this.difficulty !== 'hard') {
      
      const situation = this.evaluateSituation(board, player);
      if (Math.abs(situation.advantageRatio) < 0.2) {
        const candidates = [];
        const scoreTolerance = bestScore * 0.03; // 降低容差到 3%
        
        // 重新评估所有候选走法，找到分数接近的走法
        const allMoves = this.getCandidateMoves(board);
        for (const move of allMoves) {
          board[move.row][move.col] = player;
          const score = this.evaluatePoint(board, move.row, move.col, player);
          board[move.row][move.col] = 0;
          
          if (Math.abs(score - bestScore) <= scoreTolerance) {
            candidates.push(move);
          }
        }
        
        // 如果有多个候选，随机选择
        if (candidates.length > 1) {
          bestMove = candidates[Math.floor(Math.random() * candidates.length)];
          console.log('AI: 在多个相近走法中随机选择', { count: candidates.length });
        }
      }
    }
    
    // 如果没有找到走法，下在中心
    if (!bestMove) {
      const center = Math.floor(this.size / 2);
      // 检查中心是否被占用
      if (board[center][center] === 0) {
        bestMove = { row: center, col: center };
      } else {
        // 找一个空位
        for (let i = 0; i < this.size; i++) {
          for (let j = 0; j < this.size; j++) {
            if (board[i][j] === 0) {
              bestMove = { row: i, col: j };
              break;
            }
          }
          if (bestMove) break;
        }
      }
    }
    
    // 输出搜索统计
    const searchTime = Date.now() - this.startTime;
    console.log('AI: 搜索完成', {
      move: bestMove,
      time: `${searchTime}ms`,
      stats: {
        nodes: this.searchStats.nodes,
        cutoffs: this.searchStats.cutoffs,
        cacheHits: this.searchStats.cacheHits,
        cacheMisses: this.searchStats.cacheMisses,
        evaluations: this.searchStats.evaluations
      }
    });
    
    return bestMove;
    
    } catch (err) {
      console.error('AI: 搜索出错', err);
      // 降级策略：返回中心点
      const center = Math.floor(this.size / 2);
      return { row: center, col: center };
    }
  }
  
  // 检查对手威胁（用于调试）
  checkThreats(board, player) {
    const threats = [];
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] === 0) {
          board[i][j] = player;
          const score = this.evaluatePoint(board, i, j, player);
          board[i][j] = 0;
          
          if (score >= this.patternScores.LIVE_THREE) {
            threats.push({ row: i, col: j, score, type: score >= this.patternScores.LIVE_FOUR ? 'LIVE_FOUR' : score >= this.patternScores.RUSH_FOUR ? 'RUSH_FOUR' : 'LIVE_THREE' });
          }
        }
      }
    }
    
    return threats;
  }
  
  // ========== 搜索算法 ==========
  
  // 根节点搜索
  searchRoot(board, player, depth) {
    const moves = this.getCandidateMoves(board);
    
    if (moves.length === 0) {
      const center = Math.floor(this.size / 2);
      return { move: { row: center, col: center }, score: 0 };
    }
    
    // 获取动态防守权重（基于局势）
    const dynamicDefenseMultiplier = this.getDynamicDefenseMultiplier(board, player);
    
    // 终局优化：如果棋子超过75%，检查所有空位而不是使用候选点
    const pieceCount = this.searchStats.pieceCount || this.countPieces(board);
    const isEndgame = pieceCount > this.size * this.size * 0.75;
    
    if (isEndgame && moves.length < 40) {
      // 终局且候选点少时，考虑所有空位
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (board[i][j] === 0 && !moves.some(m => m.row === i && m.col === j)) {
            moves.push({ row: i, col: j });
          }
        }
      }
    }
    
    // 快速评估排序
    this.evaluateMoves(moves, board, player);
    
    // 关键修复：检查是否有必须防守的走法（对手有活四或冲四）
    const opponent = 3 - player;
    let criticalDefenseMove = null;
    
    for (const move of moves) {
      board[move.row][move.col] = opponent;
      const opponentScore = this.evaluatePoint(board, move.row, move.col, opponent);
      board[move.row][move.col] = 0;
      
      // 如果对手有活四，必须防守
      if (opponentScore >= this.patternScores.LIVE_FOUR) {
        criticalDefenseMove = move;
        break;
      }
    }
    
    // 如果有必须防守的走法，优先考虑防守
    if (criticalDefenseMove) {
      // 将防守走法移到最前面
      moves.splice(moves.indexOf(criticalDefenseMove), 1);
      moves.unshift(criticalDefenseMove);
    }
    
    let bestMove = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    
    for (let i = 0; i < moves.length; i++) {
      // 时间检查
      if (this.nodeCount % 256 === 0 && Date.now() - this.startTime > this.timeLimit) {
        break;
      }
      
      const move = moves[i];
      
      // 执行走法
      board[move.row][move.col] = player;
      const hash = this.calculateHash(board);
      
      // PVS 搜索
      let score;
      if (i === 0) {
        score = -this.pvs(board, depth - 1, -beta, -alpha, 3 - player, hash);
      } else {
        // 零窗口搜索
        score = -this.pvs(board, depth - 1, -alpha - 1, -alpha, 3 - player, hash);
        if (score > alpha && score < beta) {
          // 重新搜索
          score = -this.pvs(board, depth - 1, -beta, -score, 3 - player, hash);
        }
      }
      
      // 撤销走法
      board[move.row][move.col] = 0;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      
      if (score > alpha) {
        alpha = score;
      }
    }
    
    return { move: bestMove, score: bestScore };
  }
  
  // PVS（主变搜索）
  pvs(board, depth, alpha, beta, player, hash) {
    this.nodeCount++;
    this.searchStats.nodes++;  // 记录节点数
    
    // 时间检查（每 256 节点）
    if (this.nodeCount % 256 === 0) {
      if (Date.now() - this.startTime > this.timeLimit) {
        return 0;
      }
    }
    
    // 检查胜负
    const opponent = 3 - player;
    if (this.checkWin(board, opponent)) {
      return -this.patternScores.FIVE + (100 - depth); // 越深越晚赢
    }
    
    // 叶节点评估
    if (depth <= 0) {
      this.searchStats.evaluations++;  // 记录评估次数
      return this.evaluate(board, player);
    }
    
    // 置换表查询
    const hashStr = hash.toString();
    const cached = this.transpositionTable.get(hashStr);
    if (cached && cached.depth >= depth && cached.age === this.tableAge) {
      this.searchStats.cacheHits++;  // 记录缓存命中
      if (cached.flag === 'exact') {
        return cached.score;
      } else if (cached.flag === 'lower') {
        alpha = Math.max(alpha, cached.score);
      } else if (cached.flag === 'upper') {
        beta = Math.min(beta, cached.score);
      }
      if (alpha >= beta) {
        return cached.score;
      }
    } else {
      this.searchStats.cacheMisses++;  // 记录缓存未命中
    }
    
    // 获取候选走法
    const moves = this.getCandidateMoves(board);
    
    if (moves.length === 0) {
      return 0; // 平局
    }
    
    // 排序走法
    this.sortMoves(moves);
    
    let bestScore = -Infinity;
    let flag = 'upper';
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // 执行走法
      board[move.row][move.col] = player;
      const newHash = hash ^ this.zobrist[move.row][move.col][player];
      
      let score;
      if (i === 0) {
        score = -this.pvs(board, depth - 1, -beta, -alpha, 3 - player, newHash);
      } else {
        // 零窗口搜索
        score = -this.pvs(board, depth - 1, -alpha - 1, -alpha, 3 - player, newHash);
        if (score > alpha && score < beta) {
          // 重新搜索
          score = -this.pvs(board, depth - 1, -beta, -score, 3 - player, newHash);
        }
      }
      
      // 撤销走法
      board[move.row][move.col] = 0;
      
      if (score > bestScore) {
        bestScore = score;
      }
      
      if (score > alpha) {
        alpha = score;
        flag = 'exact';
        
        // 更新历史启发
        this.historyTable[move.row][move.col] += depth * depth;
      }
      
      if (alpha >= beta) {
        flag = 'lower';
        this.searchStats.cutoffs++;  // 记录剪枝次数
        break;
      }
    }
    
    // 存入置换表
    if (this.transpositionTable.size < this.maxTableSize) {
      this.transpositionTable.set(hashStr, {
        score: bestScore,
        depth: depth,
        flag: flag,
        age: this.tableAge
      });
    }
    
    return bestScore;
  }
  
  // ========== 走法生成与排序 ==========
  
  // 获取候选走法（曼哈顿距离 ≤ 2）
  getCandidateMoves(board) {
    const moves = [];
    const visited = new Set();
    
    // 使用缓存的棋子数量（如果存在）
    const pieceCount = this.searchStats?.pieceCount || this.countPieces(board);
    const complexity = this.searchStats?.complexity || pieceCount / (this.size * this.size);
    
    // 根据棋盘大小和复杂度动态调整参数
    const isEndgame = complexity > 0.75;
    const maxMoves = this.size === 19 ? (isEndgame ? 100 : 80) : (isEndgame ? 80 : 60);
    const searchDistance = isEndgame ? 3 : 2; // 终局扩大搜索范围
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] !== 0) {
          // 检查周围的空位（根据阶段调整搜索距离）
          for (let di = -searchDistance; di <= searchDistance; di++) {
            for (let dj = -searchDistance; dj <= searchDistance; dj++) {
              // 终局使用欧几里得距离，否则使用曼哈顿距离
              const distance = isEndgame 
                ? Math.sqrt(di*di + dj*dj) 
                : Math.abs(di) + Math.abs(dj);
              
              if (distance > searchDistance) continue;
              
              const ni = i + di;
              const nj = j + dj;
              const key = ni * this.size + nj;
              
              // 检查边界和是否已访问
              if (ni >= 0 && ni < this.size && nj >= 0 && nj < this.size &&
                  board[ni][nj] === 0 && !visited.has(key)) {
                visited.add(key);
                moves.push({ row: ni, col: nj });
                
                // 早期退出：如果候选点已经够多，停止搜索
                if (moves.length >= maxMoves) {
                  break;
                }
              }
            }
            if (moves.length >= maxMoves) break;
          }
          if (moves.length >= maxMoves) break;
        }
        if (moves.length >= maxMoves) break;
      }
      if (moves.length >= maxMoves) break;
    }
    
    // 如果棋盘为空，返回中心点
    if (moves.length === 0) {
      const center = Math.floor(this.size / 2);
      moves.push({ row: center, col: center });
    }
    
    return moves;
  }
  
  // 快速评估走法
  evaluateMoves(moves, board, player) {
    const opponent = 3 - player;
    let highDefenseMoves = []; // 高防守权重的走法
    
    // 获取动态防守权重（基于局势）
    const dynamicDefenseMultiplier = this.getDynamicDefenseMultiplier(board, player);
    
    for (const move of moves) {
      // 评估如果AI下在这里的收益
      board[move.row][move.col] = player;
      const attackScore = this.evaluatePoint(board, move.row, move.col, player);
      board[move.row][move.col] = 0;
      
      // 评估如果对手下在这里的威胁（防守）
      board[move.row][move.col] = opponent;
      const defenseScore = this.evaluatePoint(board, move.row, move.col, opponent);
      board[move.row][move.col] = 0;
      
      // 基础分数：进攻 - 防守（防守分数乘以动态权重）
      move.score = attackScore - (defenseScore * dynamicDefenseMultiplier);
      move.attackScore = attackScore;
      move.defenseScore = defenseScore;
      
      // 关键修复：对高威胁棋型给予额外防守权重
      // 如果对手有活四（LIVE_FOUR），必须防守，权重最高
      if (defenseScore >= this.patternScores.LIVE_FOUR) {
        move.score += 300000;  // 强制防守
        highDefenseMoves.push({ ...move, reason: 'LIVE_FOUR' });
      }
      // 如果对手有冲四（RUSH_FOUR），需要防守
      else if (defenseScore >= this.patternScores.RUSH_FOUR) {
        move.score += 80000;
        highDefenseMoves.push({ ...move, reason: 'RUSH_FOUR' });
      }
      // 如果对手有活三（LIVE_THREE），需要防守
      else if (defenseScore >= this.patternScores.LIVE_THREE) {
        move.score += 15000;
        highDefenseMoves.push({ ...move, reason: 'LIVE_THREE' });
      }
      
      // 加上位置权重
      move.score += this.positionWeight[move.row][move.col];
    }
    
    // 如果有高防守权重的走法，输出调试信息
    if (highDefenseMoves.length > 0) {
      console.log('AI: 检测到高防守权重走法', highDefenseMoves.map(m => ({
        row: m.row, col: m.col, reason: m.reason, defenseScore: m.defenseScore, finalScore: m.score
      })));
    }
    
    // 按分数降序排序
    moves.sort((a, b) => b.score - a.score);
    
    // 只保留前 20 个最有希望的走法（进一步剪枝）
    if (moves.length > 20) {
      return moves.slice(0, 20);
    }
    return moves;
  }
  
  // 获取某个点的棋型信息
  getPointPatterns(board, row, col, player) {
    const patterns = [];
    
    // 先模拟落子
    board[row][col] = player;
    
    for (const [dx, dy] of this.directions) {
      const result = this.countLine(board, row, col, dx, dy, player);
      patterns.push({ count: result.count, open: result.open });
    }
    
    // 撤销模拟
    board[row][col] = 0;
    
    return patterns;
  }
  
  // 检查是否有危险棋型（双活三、冲四活三等）
  hasDangerousPatterns(patterns) {
    let liveThree = 0;
    let rushFour = 0;
    
    for (const p of patterns) {
      const score = this.getPatternScore(p.count, p.open);
      if (score === this.patternScores.LIVE_THREE) liveThree++;
      else if (score === this.patternScores.RUSH_FOUR) rushFour++;
    }
    
    // 双活三或冲四活三
    return (liveThree >= 2) || (rushFour >= 1 && liveThree >= 1);
  }
  
  // 排序走法（历史启发 + 位置权重）
  sortMoves(moves) {
    moves.sort((a, b) => {
      // 历史启发优先
      const histA = this.historyTable[a.row][a.col];
      const histB = this.historyTable[b.row][b.col];
      
      if (histA !== histB) {
        return histB - histA;
      }
      
      // 位置权重次之
      const posA = this.positionWeight[a.row][a.col];
      const posB = this.positionWeight[b.row][b.col];
      
      return posB - posA;
    });
  }
  
  // ========== 评估函数 ==========
  
  // 评估棋盘
  evaluate(board, player) {
    let score = 0;
    
    // 获取动态防守权重（基于局势）
    const dynamicDefenseMultiplier = this.getDynamicDefenseMultiplier(board, player);
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] === player) {
          score += this.evaluatePoint(board, i, j, player);
        } else if (board[i][j] === 3 - player) {
          // 使用动态防守权重
          const opponentScore = this.evaluatePoint(board, i, j, 3 - player);
          score -= opponentScore * dynamicDefenseMultiplier;
        }
      }
    }
    
    return score;
  }
  
  // 评估单个点
  evaluatePoint(board, row, col, player) {
    let score = 0;
    let patterns = [];
    
    for (const [dx, dy] of this.directions) {
      const result = this.countLine(board, row, col, dx, dy, player);
      const patternScore = this.getPatternScore(result.count, result.open);
      score += patternScore;
      patterns.push({ count: result.count, open: result.open, score: patternScore });
    }
    
    // 组合棋型加分
    score += this.evaluateCombinations(patterns);
    
    // 加上位置权重
    score += this.positionWeight[row][col];
    
    return score;
  }
  
  // 评估组合棋型（双活三、冲四活三等）
  evaluateCombinations(patterns) {
    let bonus = 0;
    
    // 统计各种棋型数量
    let liveThree = 0;
    let rushFour = 0;
    let liveTwo = 0;
    
    for (const p of patterns) {
      if (p.score === this.patternScores.LIVE_THREE) liveThree++;
      else if (p.score === this.patternScores.RUSH_FOUR) rushFour++;
      else if (p.score === this.patternScores.LIVE_TWO) liveTwo++;
    }
    
    // 双活三 = 50000（几乎必胜）
    if (liveThree >= 2) {
      bonus += 50000;
    }
    
    // 冲四活三 = 30000（很强）
    if (rushFour >= 1 && liveThree >= 1) {
      bonus += 30000;
    }
    
    // 双活二 = 500（有潜力）
    if (liveTwo >= 2) {
      bonus += 500;
    }
    
    return bonus;
  }
  
  // 统计一条线上的棋子
  countLine(board, row, col, dx, dy, player) {
    let count = 1;
    let open = 0;
    
    // 正向
    for (let i = 1; i < 5; i++) {
      const ni = row + i * dx;
      const nj = col + i * dy;
      
      if (ni < 0 || ni >= this.size || nj < 0 || nj >= this.size) {
        break;
      }
      
      if (board[ni][nj] === player) {
        count++;
      } else if (board[ni][nj] === 0) {
        open++;
        break;
      } else {
        break;
      }
    }
    
    // 反向
    for (let i = 1; i < 5; i++) {
      const ni = row - i * dx;
      const nj = col - i * dy;
      
      if (ni < 0 || ni >= this.size || nj < 0 || nj >= this.size) {
        break;
      }
      
      if (board[ni][nj] === player) {
        count++;
      } else if (board[ni][nj] === 0) {
        open++;
        break;
      } else {
        break;
      }
    }
    
    return { count, open };
  }
  
  // 根据棋型获取分数
  getPatternScore(count, open) {
    if (count >= 5) {
      return this.patternScores.FIVE;
    }
    
    if (count === 4) {
      if (open === 2) return this.patternScores.LIVE_FOUR;
      if (open === 1) return this.patternScores.RUSH_FOUR;
    }
    
    if (count === 3) {
      if (open === 2) return this.patternScores.LIVE_THREE;
      if (open === 1) return this.patternScores.SLEEP_THREE;
    }
    
    if (count === 2) {
      if (open === 2) return this.patternScores.LIVE_TWO;
      if (open === 1) return this.patternScores.SLEEP_TWO;
    }
    
    return 0;
  }
  
  // ========== 辅助函数 ==========
  
  // 检查胜利
  checkWin(board, player) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] === player) {
          for (const [dx, dy] of this.directions) {
            let count = 1;
            for (let k = 1; k < 5; k++) {
              const ni = i + k * dx;
              const nj = j + k * dy;
              if (ni >= 0 && ni < this.size && nj >= 0 && nj < this.size &&
                  board[ni][nj] === player) {
                count++;
              } else {
                break;
              }
            }
            if (count >= 5) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  
  // 计算 Zobrist 哈希
  calculateHash(board) {
    let hash = 0n;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] !== 0) {
          hash ^= this.zobrist[i][j][board[i][j]];
        }
      }
    }
    return hash;
  }
  
  // 清理置换表
  cleanTranspositionTable() {
    // 删除旧年龄的项
    for (const [key, value] of this.transpositionTable) {
      if (value.age < this.tableAge) {
        this.transpositionTable.delete(key);
      }
    }
    
    // 如果还是太大，清空
    if (this.transpositionTable.size > this.maxTableSize * 0.8) {
      this.transpositionTable.clear();
    }
  }
}

// 导出（支持浏览器和 Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GomokuAI;
}
