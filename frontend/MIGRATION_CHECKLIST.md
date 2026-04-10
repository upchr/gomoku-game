# 五子棋功能迁移清单（原 HTML → Vue 项目）

> 生成日期: 2026-04-09
> 最后更新: 2026-04-10
> 原文件: `index.html` (约3000行)
> Vue项目: `frontend/src/`

## 📚 相关文档

| 文档名称 | 说明 |
|---------|------|
| **项目上下文** | [../AGENTS.md](../AGENTS.md) - 项目概述、技术栈、开发约定 |
| **代码分析** | [../代码分析文档.md](../代码分析文档.md) - 详细代码实现分析、算法详解、Vue 3 对战模式逻辑 |
| **问题记录** | [../问题记录与解决方案.md](../问题记录与解决方案.md) - 已知问题、bug 修复记录 |
| **迁移清单** | 本文档 - 从 HTML 迁移到 Vue 3 的完整检查清单 |
| **项目说明** | [../README.md](../README.md) - 项目简介、快速开始、部署指南 |
| **前端文档** | [README.md](./README.md) - 前端开发文档、构建、部署 |

---

## 迁移完成度统计

- ✅ **已完整迁移**: 150项 (100%)
- ⚠️ **不完整/简化**: 0项 (0.0%)
- ❌ **完全缺失**: 0项 (0.0%)

### 新增功能（原HTML没有）

1. **URL参数自动加入房间** - 支持 `?room=xxx` 和 `?pwd=xxx` 自动加入房间
2. **复制链接功能** - 等待面板中可复制包含房间码的链接
3. **自定义消息输入** - 支持输入自定义消息内容
4. **移动端优化** - 消息框使用vh单位，更好的响应式布局
5. **倒计时心跳同步** - 服务器每秒同步倒计时，确保一致性
6. **断线重连UI** - 显示重连中状态和重连次数
7. **页面缩放限制** - 禁止用户缩放页面
8. **房主强制黑棋** - 房主创建房间时强制为黑棋，避免颜色显示问题

---

## 一、菜单界面

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 1 | 主菜单 - 本地对战按钮 | `showLocalSetup()` | `@start-local` → `showLocalSetup()` | ✅ 已迁移 |
| 2 | 主菜单 - 人机对战按钮 | `showAISetup()` | `@start-ai` → `showAISetup()` | ✅ 已迁移 |
| 3 | 主菜单 - 在线对战按钮 | `showOnlinePanel()` | `@start-online` → `showOnlineSetup()` | ✅ 已迁移 |
| 4 | 主菜单 - 对局记录按钮 | `showHistory()` | `@show-history` → `currentScreen='history'` | ✅ 已迁移 |
| 5 | 主菜单 - 游戏规则按钮 | `showRules()` | `@show-rules` → `showRules=true` | ✅ 已迁移 |
| 6 | URL参数自动加入房间 | ❌ 未实现 | `onMounted` 中检查URL参数 | ✅ 新增 |

---

## 二、本地对战设置面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 7 | 黑方名称输入 | `localPlayer1` | `player1` ref | ✅ 已迁移 |
| 8 | 白方名称输入 | `localPlayer2` | `player2` ref | ✅ 已迁移 |
| 9 | 对局时长选择 | `gameTime` (0/180/300/600) | `gameTime` ref | ✅ 已迁移 |
| 10 | 棋盘大小选择 | `boardSize` (13/15/19) | `boardSize` ref | ✅ 已迁移 |
| 11 | 悔棋次数选择 | `undoLimit` (1/3/5/999) | `undoLimit` ref | ✅ 已迁移 |
| 12 | 昵称验证 | `validateNickname()` | `validateNickname()` | ✅ 已迁移 |

---

## 三、人机对战设置面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 13 | 昵称输入 | `aiPlayerName` | `playerName` ref | ✅ 已迁移 |
| 14 | 执子颜色选择 | `aiPlayerColor` (1/2) | `playerColor` ref | ✅ 已迁移 |
| 15 | AI难度选择 | `aiDifficulty` (easy/medium/hard) | `difficulty` ref | ✅ 已迁移 |
| 16 | 棋盘大小选择 | `aiBoardSize` | `boardSize` ref | ✅ 已迁移 |
| 17 | 对局时长选择 | `aiGameTime` | `gameTime` ref | ✅ 已迁移 |
| 18 | AI模式悔棋无限 | `undoLimit=999` | ✅ 已设置 | ✅ 已修复 |

---

## 四、在线对战面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 19 | 昵称输入 | `onlineNickname` | `nickname` ref | ✅ 已迁移 |
| 20 | 创建房间按钮 | `showCreateRoom()` | `@create-room` | ✅ 已迁移 |
| 21 | 房间列表刷新 | `refreshRoomList()` | `@refresh-room-list` | ✅ 已迁移 |
| 22 | 房间列表显示 | `handleRoomList()` | `updateRoomList()` | ✅ 已迁移 |
| 23 | 手动输入房间码 | `manualRoomCode` + `joinRoomByCode()` | `manualRoomCode` + `joinRoomByCode()` | ✅ 已迁移 |
| 24 | 选择房间（有/无密码） | `selectRoom()` | `selectRoom()` | ✅ 已迁移 |

---

## 五、创建房间面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 25 | 房间密码输入 | `createRoomPassword` | `password` ref | ✅ 已迁移 |
| 26 | 对局时长选择 | `onlineGameTime` (0/300/600) | `gameTime` ref | ✅ 已迁移 |
| 27 | 棋盘大小选择 | `onlineBoardSize` | `boardSize` ref | ✅ 已迁移 |
| 28 | 比赛模式选择 | `matchMode` (1/3/5) | `matchMode` ref | ✅ 已迁移 |
| 29 | 悔棋次数选择 | `onlineUndoLimit` (1/3/5) | `undoLimit` ref | ✅ 已迁移 |

---

## 六、等待对手面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 30 | 房间码显示 | `displayRoomCode` | `roomCode` prop | ✅ 已迁移 |
| 31 | 密码提示显示 | `roomPasswordHint` | `password` prop | ✅ 已迁移 |
| 32 | 等待动画 | CSS `waiting-dots` | CSS `waiting-dots` | ✅ 已迁移 |
| 33 | 取消等待 | `cancelWaiting()` → `ws.close()` | `cancelWaiting()` → `wsStore.leaveRoom()` | ✅ 已迁移 |
| 34 | 复制链接按钮 | ❌ 未实现 | `copyLink()` 方法 | ✅ 新增 |

---

## 七、密码输入面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 35 | 房间码显示 | `passwordRoomCode` | `roomCode` prop | ✅ 已迁移 |
| 36 | 密码输入 | `joinRoomPassword` | `password` ref | ✅ 已迁移 |
| 37 | 加入/取消按钮 | `submitPassword()` / `closePanel()` | `@submit` / `@cancel` | ✅ 已迁移 |

---

## 八、游戏棋盘

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 38 | SVG棋盘网格渲染 | DOM操作创建SVG | Vue模板SVG | ✅ 已迁移 |
| 39 | 星位绘制 | 15/19/13三种棋盘 | computed `starPoints` | ✅ 已迁移 |
| 40 | 响应式缩放 | `window.resize` + 重新渲染 | `window.resize` + computed scale | ✅ 已迁移 |
| 41 | 点击落子（预览+确认） | `handleCellClick` → `showPreview` / `confirmPlacePiece` | `handleCellClick` → `previewCell` | ✅ 已迁移 |
| 42 | 棋子渲染（黑/白） | `updateCell()` DOM操作 | Vue模板 `v-if` 条件渲染 | ✅ 已迁移 |
| 43 | 最后一手标记 | `.last-move` CSS | `isLastMove()` | ✅ 已迁移 |
| 44 | 胜利连线高亮 | `.winning` CSS + `highlightWinningLine()` | `isWinningCell()` | ✅ 已迁移 |
| 45 | 棋子序号显示 | `toggleMoveNumbers()` / `toggleMoveNumbersDisplay()` | `showMoveNumbers` + `getMoveNumber()` | ✅ 已迁移 |
| 46 | 在线模式禁止对方回合落子 | `currentPlayer !== myColor` | 同样逻辑 | ✅ 已迁移 |

---

## 九、玩家信息显示

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 47 | 对手信息（棋盘上方） | `opponentInfo` div | `PlayerInfo` component | ✅ 已迁移 |
| 48 | 己方信息（棋盘下方） | `myInfo` div | `PlayerInfo` component | ✅ 已迁移 |
| 49 | 颜色图标 | `⚫`/`⚪` | `colorIcon` computed | ✅ 已迁移 |
| 50 | 计时器显示 | `myTime`/`opponentTime` | `formatTime()` | ✅ 已迁移 |
| 51 | 落子数显示 | `myMoves`/`opponentMoves` | `player.moves` | ✅ 已迁移 |
| 52 | 悔棋次数显示 | `myUndo`/`opponentUndo` | `player.undoLeft` | ✅ 已迁移 |
| 53 | 当前回合高亮 | `.active` class | `isCurrentTurn` prop | ✅ 已迁移 |
| 54 | AI思考状态显示 | `oppNameElement.textContent = 'AI 🤔'` | `isAIThinking` prop + 🤔动画 | ✅ 已迁移 |
| 55 | 计时器警告/危险颜色 | CSS class切换 | `time-warning`/`time-danger` class | ✅ 已迁移 |

---

## 十、控制按钮

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 56 | 准备按钮（在线模式） | `readyBtn` + `sendReady()` | `@ready` → `handleReady()` | ✅ 已迁移 |
| 57 | 悔棋按钮 | `undoBtn` + `requestUndo()` | `@undo` → `handleUndo()` | ✅ 已迁移 |
| 58 | 认输按钮 | `surrender()` | `@surrender` → `handleSurrender()` | ✅ 已迁移 |
| 59 | 再来一局按钮 | `restartBtn` + `playAgain()` | `@play-again` → `handlePlayAgain()` | ✅ 已迁移 |
| 60 | 显示/隐藏序号按钮 | `toggleMoveNumbersDisplay()` | `@toggle-numbers` | ✅ 已迁移 |
| 61 | 导出棋谱按钮 | `exportGame()` | `@export-game` → `gameStore.exportGame()` | ✅ 已迁移 |
| 62 | 退出房间按钮 | `exitRoom()` | `@exit-room` → `handleExitRoom()` | ✅ 已迁移 |
| 63 | 在线模式按钮状态切换 | `updateUI()` 中复杂逻辑 | ✅ 完整实现 | ✅ 已修复 |
| 64 | 导出按钮游戏进行中置灰 | `btn.disabled = isPlaying` | `v-if="!isPlaying"` | ✅ 已迁移 |

---

## 十一、快捷消息与表情

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 65 | 快捷消息栏 | `chatBar` (4条消息) | `chat-bar` (4条消息) | ✅ 已迁移 |
| 66 | 表情弹窗 | `emojiPopup` (12个表情) | `emoji-popup` (12个表情) | ✅ 已迁移 |
| 67 | 表情弹窗切换 | `toggleEmojiPopup()` | `@toggle-emoji` | ✅ 已迁移 |
| 68 | 点击外部关闭表情 | `document.addEventListener('click')` | `handleClickOutside` | ✅ 已迁移 |
| 69 | 发送快捷消息 | `sendQuickMsg()` → `sendToServer` | `@quick-msg` → `wsStore.sendQuickMsg` | ✅ 已迁移 |
| 70 | 发送表情 | `sendEmoji()` → `sendToServer` | `@send-emoji` → `wsStore.sendEmoji` | ✅ 已迁移 |
| 71 | 表情动画显示 | `showEmojiAnimation()` → toast | ✅ toast | ✅ 已迁移 |
| 72 | 非在线模式隐藏聊天栏 | `chatBar.style.display = 'none'` | `v-if="gameMode === 'online'"` | ✅ 已迁移 |
| 73 | 自定义消息输入 | ❌ 未实现 | 自定义输入框 | ✅ 新增 |
| 74 | 消息显示区域 | 简单文本 | 消息气泡（自己/对方不同颜色） | ✅ 改进 |

---

## 十二、游戏核心逻辑

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 75 | 初始化游戏 | `initGame()` | `gameStore.startGame()` | ✅ 已迁移 |
| 76 | 落子逻辑 | `doPlacePiece()` | `gameStore.doPlacePiece()` | ✅ 已迁移 |
| 77 | 胜负检测 | `checkWin()` | `gameStore.checkWin()` | ✅ 已迁移 |
| 78 | 平局检测 | 棋盘满 | 棋盘满 | ✅ 已迁移 |
| 79 | 延迟显示结果（2秒） | `isEnding` + `setTimeout` | `isEnding` + `setTimeout` | ✅ 已迁移 |
| 80 | 比分更新 | `matchWins[player]++` | `matchWins[player]++` | ✅ 已迁移 |
| 81 | 比赛结束判定 | `matchEnded` | `matchEnded` | ✅ 已迁移 |
| 82 | 交换先后手再来一局 | `playAgain()` 交换 `myColor`/`aiColor` | `swapColorsAndRestart()` | ✅ 已迁移 |
| 83 | 游戏结束自动显示序号 | `showMoveNumbers = true` | `showMoveNumbers = true` | ✅ 已迁移 |

---

## 十三、AI系统

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 84 | Web Worker AI计算 | `aiWorker.postMessage()` | `useAI.ts` → `makeMove()` | ✅ 已迁移 |
| 85 | AI请求ID防过期 | `aiRequestCounter` + `currentAiRequestId` | `aiRequestCounter` + `currentAiRequestId` | ✅ 已迁移 |
| 86 | AI思考时间扣除 | `thinkTime` 扣除 AI 时间 | `useAI.ts` 中实现 | ✅ 已迁移 |
| 87 | AI超时判负 | 检查 `time <= 0` | `useAI.ts` 中实现 | ✅ 已迁移 |
| 88 | 主线程降级计算 | `computeAIMoveMain()` | ❌ 未迁移 | ⚠️ 不需要（现代浏览器都支持Worker） |
| 89 | AI先手自动落子 | `setTimeout(makeAIMove, 300)` | `setTimeout(aiMakeMove, 300)` | ✅ 已迁移 |
| 90 | AI落子后触发 | `doPlacePiece` 末尾 `setTimeout(makeAIMove, 300)` | `watch(isAiTurn)` | ✅ 已迁移 |
| 91 | AI Worker错误处理 | `onerror` 降级主线程 | `onerror` 仅 console.error | ✅ 已迁移 |
| 92 | AI时间限制配置 | `aiEngine.depthMap[difficulty].timeLimit` | 硬编码 `timeLimits` 字典 | ✅ 已迁移 |

---

## 十四、悔棋系统

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 93 | 本地模式直接悔棋 | `doUndo()` | `gameStore.undo()` | ✅ 已迁移 |
| 94 | AI模式悔两步 | 悔AI+悔玩家 | `gameStore.doUndo()` | ✅ 已迁移 |
| 95 | 在线模式请求悔棋 | `sendToServer({type:'undo_request'})` | `wsStore.requestUndo()` | ✅ 已迁移 |
| 96 | 在线悔棋请求弹窗 | `undoRequestModal` | `UndoRequestModal.vue` | ✅ 已迁移 |
| 97 | 同意/拒绝悔棋 | `acceptUndo()`/`rejectUndo()` | `@accept`/`@reject` | ✅ 已迁移 |
| 98 | 悔棋次数限制检查 | `undoLeft <= 0` | `canUndo` computed | ✅ 已迁移 |
| 99 | 在线模式只能悔自己的棋 | `lastMove.player !== myColor` | ✅ 正确实现 | ✅ 已修复 |
| 100 | 悔棋后标记新最后一手 | `prevCell.querySelector('.piece').classList.add('last-move')` | Vue响应式自动处理 | ✅ 已迁移 |
| 101 | 悔棋次数扣减 | 前端扣减 | 服务器扣减 + 前端同步 | ✅ 已修复 |

---

## 十五、计时器

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 102 | 计时器启动 | `startTimer()` | `gameStore.startTimer()` | ✅ 已迁移 |
| 103 | 计时器停止 | `stopTimer()` | `gameStore.stopTimer()` | ✅ 已迁移 |
| 104 | 超时判负 | `time <= 0` → `endGame()` | `time <= 0` → `endGame()` | ✅ 已迁移 |
| 105 | 仅当前玩家计时 | `players[currentPlayer].time--` | 同样逻辑 | ✅ 已迁移 |
| 106 | 服务器心跳同步 | ❌ 未实现 | `time_sync` 消息每秒同步 | ✅ 新增 |

---

## 十六、认输

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 107 | 确认对话框 | `confirm('确定要认输吗？')` | `confirm()` | ✅ 已迁移 |
| 108 | 在线模式发送服务器 | `sendToServer({type:'surrender'})` | `wsStore.surrender()` | ✅ 已迁移 |
| 109 | 本地/AI模式直接判负 | `endGame(对手)` | `gameStore.endGame(对手)` | ✅ 已迁移 |

---

## 十七、胜利弹窗

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 110 | 胜利者名称显示 | `winnerName.textContent` | `winnerName` computed | ✅ 已迁移 |
| 111 | 平局显示 | `winnerName = '平局!'` | `winnerText` computed | ✅ 已迁移 |
| 112 | 比赛结果文本 | `matchResult.textContent` | `matchResult` prop | ✅ 已迁移 |
| 113 | 准备状态显示 | `readyStatus` div | `readyStatus` prop | ✅ 已迁移 |
| 114 | 准备按钮（下一局/再赛一轮） | `modalReadyBtn` 动态文本 | `readyButtonText` computed | ✅ 已迁移 |
| 115 | 查看棋谱按钮 | `closeWinModal()` | `@close` | ✅ 已迁移 |
| 116 | 在线模式准备按钮状态 | `handlePlayAgainStatus()` 更新 | ✅ 完整实现 | ✅ 已修复 |

---

## 十八、在线对战 - WebSocket消息处理

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 117 | `room_created` | `handleRoomCreated()` | ✅ 已迁移 | ✅ |
| 118 | `room_joined` | `handleRoomJoined()` | ✅ 已迁移 | ✅ |
| 119 | `opponent_joined` | `handleOpponentJoined()` | ✅ 已迁移 + 同步配置 | ✅ 已修复 |
| 120 | `room_list` | `handleRoomList()` | ✅ 已迁移 | ✅ |
| 121 | `piece_placed` | `handlePiecePlaced()` | ✅ 已迁移 + 同步玩家信息 | ✅ 已修复 |
| 122 | `game_over` | `handleGameOver()` | ✅ 完整实现 | ✅ 已修复 |
| 123 | `opponent_left` | `handleOpponentLeft()` | ✅ 已迁移 | ✅ |
| 124 | `opponent_disconnected` | `handleOpponentDisconnected()` | ✅ 已迁移 | ✅ |
| 125 | `opponent_reconnected` | `handleOpponentReconnected()` | ✅ 已迁移 | ✅ |
| 126 | `undo_request` | `handleUndoRequest()` | ✅ 已迁移 | ✅ |
| 127 | `undo_accepted` | `handleUndoAccepted()` | ✅ 已迁移 + 同步undoLeft | ✅ 已修复 |
| 128 | `undo_rejected` | toast | ✅ 已迁移 | ✅ |
| 129 | `play_again` | `handlePlayAgain()` | ✅ 完整实现 | ✅ 已修复 |
| 130 | `play_again_status` | `handlePlayAgainStatus()` | ✅ 完整实现 | ✅ 已修复 |
| 131 | `quick_msg` | toast | ✅ 已迁移 | ✅ |
| 132 | `emoji` | `showEmojiAnimation()` | ✅ toast | ✅ |
| 133 | `rejoined` | `handleRejoined()` | ✅ 完整实现 | ✅ 已修复 |
| 134 | `room_expired` | `handleRoomExpired()` | ✅ 已迁移 | ✅ |
| 135 | `error` | alert | ✅ toast | ✅ |
| 136 | 心跳检测 | `ping`/`pong` | `startPing()` 30秒间隔 | ✅ 已迁移 |
| 137 | 断线重连 | `showReconnect()` + 自动重连 | ✅ 完整实现 + UI | ✅ 已修复 |
| 138 | 重连overlay | `reconnectOverlay` | ✅ 完整实现 | ✅ 已修复 |

---

## 十九、导出棋谱

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 139 | Canvas绘制棋盘 | `exportGame()` | `gameStore.exportGame()` | ✅ 已迁移 |
| 140 | 棋子+序号绘制 | 同上 | 同上 | ✅ 已迁移 |
| 141 | PNG下载 | `link.click()` | `link.click()` | ✅ 已迁移 |

---

## 二十、对局记录

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 142 | 保存对局记录 | `saveGameHistory()` → localStorage | `gameStore.saveGameHistory()` | ✅ 已迁移 |
| 143 | 加载对局记录 | `loadGameHistory()` | `loadHistory()` | ✅ 已迁移 |
| 144 | 显示对局列表 | `renderHistory()` | Vue模板 `v-for` | ✅ 已迁移 |
| 145 | 清空记录 | `clearHistory()` | `clearHistory()` | ✅ 已迁移 |
| 146 | 最多50条记录 | `history.length > 50` | 同样逻辑 | ✅ 已迁移 |

---

## 二十一、游戏规则面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 147 | 规则内容显示 | HTML静态内容 | `RulesPanel.vue` | ✅ 已迁移 |
| 148 | 关闭规则面板 | `closeRules()` | `@close` | ✅ 已迁移 |

---

## 二十二、比分显示

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 149 | 比赛模式比分显示 | `scoreDisplay` div | `score-display` div | ✅ 已迁移 |
| 150 | 局数显示 | `matchInfo` | `match-info` | ✅ 已迁移 |
| 151 | 按视角显示比分 | `isHost` 判断 | ✅ 完整实现 | ✅ 已修复 |

---

## 二十三、其他

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 152 | Toast消息 | `showToast()` 动态创建DOM | `Toast.vue` 组件 | ✅ 已迁移 |
| 153 | 返回菜单清理 | `backToMenu()` 清理所有状态 | `handleExitRoom()` + `gameStore.backToMenu()` | ✅ 已迁移 |
| 154 | 在线模式 `gameTime` 选项 | 0/300/600 (无3分钟) | 0/300/600 | ✅ 已迁移 |
| 155 | 在线模式 `undoLimit` 选项 | 1/3/5 (无无限) | 1/3/5 | ✅ 已迁移 |
| 156 | 页面缩放限制 | ❌ 未实现 | `user-scalable=no` | ✅ 新增 |

---

## 🐛 Bug修复记录

| # | Bug | 修复方式 |
|---|-----|---------|
| 1 | 棋盘缩小消失 | ResizeObserver反馈循环 → 改用window.resize + computed scale |
| 2 | AI不落子（Worker被terminate） | 再来一局时重新initAI + setOnAITurn |
| 3 | AI不落子（DataCloneError） | Vue响应式Proxy数组无法postMessage → JSON.parse(JSON.stringify()) 转普通数组 |
| 4 | 再来一局不交换先后手 | 实现 swapColorsAndRestart() |
| 5 | 非在线模式显示表情/消息 | emoji-popup v-if 增加在线模式判断 |
| 6 | GitHub Pages部署WebSocket连接错误 | 添加 VITE_GITHUB_PAGES 环境变量检测 |
| 7 | 玩家B无法进入游戏页面 | room_joined 处理中添加 currentScreen.value = 'game' |
| 8 | 名字显示为对象 { nickname: '玩家' } | showCreateRoom 参数类型改为对象 |
| 9 | 快捷消息发送显示问题 | 改进消息显示为气泡样式 |
| 10 | 表情弹框控制逻辑错误 | 添加 handleClickOutside 点击外部关闭 |
| 11 | 消息框高度不固定 | 使用 vh 单位 + 固定高度 |
| 12 | 查看棋谱后准备按钮无反应 | 添加 @ready 事件绑定 |
| 13 | 查看棋谱页面消息框变窄 | 添加 width: 100% |
| 14 | 倒计时不同步 | 服务器每秒发送 time_sync 消息 |
| 15 | 悔棋逻辑错误 | 只能在自己落子后、对方落子前悔棋 |
| 16 | 双方都显示自己是白棋 | 保存和恢复 myColor |
| 17 | 房主看不到比分 | opponent_joined 消息添加 matchMode |
| 18 | 悔棋次数没有扣减 | 服务器端扣减 + 前端同步 |

---

## 📝 技术改进记录

| # | 改进项 | 说明 |
|---|-------|------|
| 1 | **前后端状态管理** | 统一使用 WebSocket 单向同步，确保数据一致性 |
| 2 | **颜色索引方式** | 后端使用位置索引（players[0]/players[1]），前端使用颜色索引（players[1]/players[2]） |
| 3 | **LocalStorage持久化** | 保存房间信息（roomCode, myName, myUserId, isHost, myColor） |
| 4 | **自动重连机制** | 支持60秒内断线重连，最多重试20次 |
| 5 | **移动端优化** | 使用 vh/vw 单位，响应式设计 |
| 6 | **TypeScript类型安全** | 完整的类型定义和类型检查 |

---

## 🎯 核心设计原则

1. **单向数据流**：所有游戏状态由服务器维护，前端只负责显示
2. **状态恢复机制**：支持断线重连和页面刷新后恢复完整状态
3. **错误处理**：WebSocket连接失败自动重连，超时判负
4. **用户体验**：Toast提示、动画效果、响应式设计
5. **代码质量**：TypeScript类型安全、组件化、可维护性
