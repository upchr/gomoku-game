/**
 * 五子棋 AI 引擎
 * 算法：Alpha-Beta 剪枝 + 迭代加深 + PVS（主变搜索）
 * 优化：Zobrist 置换表、历史启发、候选点剪枝
 * 纯 Vanilla JS 实现，无外部依赖
 */

class GomokuAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.size = 15;
    
    // 根据难度设置搜索深度
    this.depthMap = {
      'easy': { min: 4, max: 6 },
      'medium': { min: 8, max: 10 },
      'hard': { min: 12, max: 14 }
    };
    
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
    
    // 位置权重矩阵（中心权重更高）
    this.positionWeight = this.createPositionWeight();
    
    // 棋型评分
    this.patternScores = {
      FIVE: 10000000,      // 连五
      LIVE_FOUR: 100000,   // 活四
      RUSH_FOUR: 10000,    // 冲四
      LIVE_THREE: 1000,    // 活三
      SLEEP_THREE: 100,    // 眠三
      LIVE_TWO: 50,        // 活二
      SLEEP_TWO: 10        // 眠二
    };
    
    // 方向数组（四个方向）
    this.directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
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
   * @param {number} timeLimit - 时间限制（毫秒）
   * @returns {{row: number, col: number}} - 最佳走法
   */
  getBestMove(board, player, timeLimit = 1000) {
    this.timeLimit = timeLimit;
    this.startTime = Date.now();
    this.nodeCount = 0;
    this.tableAge++;
    
    // 清理过旧的置换表项
    if (this.transpositionTable.size > this.maxTableSize) {
      this.cleanTranspositionTable();
    }
    
    // 重置历史启发表
    this.historyTable = this.createArray2D(0);
    
    const depthConfig = this.depthMap[this.difficulty];
    let bestMove = null;
    let bestScore = -Infinity;
    
    // 迭代加深搜索
    for (let depth = 2; depth <= depthConfig.max; depth += 2) {
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
      if (depth >= depthConfig.max) {
        break;
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
    
    return bestMove;
  }
  
  // ========== 搜索算法 ==========
  
  // 根节点搜索
  searchRoot(board, player, depth) {
    const moves = this.getCandidateMoves(board);
    
    if (moves.length === 0) {
      const center = Math.floor(this.size / 2);
      return { move: { row: center, col: center }, score: 0 };
    }
    
    // 快速评估排序
    this.evaluateMoves(moves, board, player);
    
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
      return this.evaluate(board, player);
    }
    
    // 置换表查询
    const hashStr = hash.toString();
    const cached = this.transpositionTable.get(hashStr);
    if (cached && cached.depth >= depth && cached.age === this.tableAge) {
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
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] !== 0) {
          // 检查周围的空位（曼哈顿距离 ≤ 2）
          for (let di = -2; di <= 2; di++) {
            for (let dj = -2; dj <= 2; dj++) {
              if (Math.abs(di) + Math.abs(dj) > 2) continue;
              
              const ni = i + di;
              const nj = j + dj;
              const key = ni * this.size + nj;
              
              if (ni >= 0 && ni < this.size && nj >= 0 && nj < this.size &&
                  board[ni][nj] === 0 && !visited.has(key)) {
                visited.add(key);
                moves.push({ row: ni, col: nj });
              }
            }
          }
        }
      }
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
    for (const move of moves) {
      // 快速评分
      board[move.row][move.col] = player;
      move.score = this.evaluatePoint(board, move.row, move.col, player);
      move.score -= this.evaluatePoint(board, move.row, move.col, 3 - player);
      board[move.row][move.col] = 0;
      
      // 加上位置权重
      move.score += this.positionWeight[move.row][move.col];
    }
    
    // 按分数降序排序
    moves.sort((a, b) => b.score - a.score);
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
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (board[i][j] === player) {
          score += this.evaluatePoint(board, i, j, player);
        } else if (board[i][j] === 3 - player) {
          score -= this.evaluatePoint(board, i, j, 3 - player) * 1.1; // 进攻优先
        }
      }
    }
    
    return score;
  }
  
  // 评估单个点
  evaluatePoint(board, row, col, player) {
    let score = 0;
    
    for (const [dx, dy] of this.directions) {
      const result = this.countLine(board, row, col, dx, dy, player);
      score += this.getPatternScore(result.count, result.open);
    }
    
    // 加上位置权重
    score += this.positionWeight[row][col];
    
    return score;
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
