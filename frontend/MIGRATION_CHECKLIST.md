# 五子棋功能迁移清单（原 HTML → Vue 项目）

> 生成日期: 2026-04-09
> 原文件: `index.html` (约3000行)
> Vue项目: `frontend/src/`

---

## 一、菜单界面

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 1 | 主菜单 - 本地对战按钮 | `showLocalSetup()` | `@start-local` → `showLocalSetup()` | ✅ 已迁移 |
| 2 | 主菜单 - 人机对战按钮 | `showAISetup()` | `@start-ai` → `showAISetup()` | ✅ 已迁移 |
| 3 | 主菜单 - 在线对战按钮 | `showOnlinePanel()` | `@start-online` → `showOnlineSetup()` | ✅ 已迁移 |
| 4 | 主菜单 - 对局记录按钮 | `showHistory()` | `@show-history` → `currentScreen='history'` | ✅ 已迁移 |
| 5 | 主菜单 - 游戏规则按钮 | `showRules()` | `@show-rules` → `showRules=true` | ✅ 已迁移 |
| 6 | URL参数自动加入房间 | `?room=xxx` 自动打开在线面板 | ❌ 未迁移 | ⚠️ 缺失 |

## 二、本地对战设置面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 7 | 黑方名称输入 | `localPlayer1` | `player1` ref | ✅ 已迁移 |
| 8 | 白方名称输入 | `localPlayer2` | `player2` ref | ✅ 已迁移 |
| 9 | 对局时长选择 | `gameTime` (0/180/300/600) | `gameTime` ref | ✅ 已迁移 |
| 10 | 棋盘大小选择 | `boardSize` (13/15/19) | `boardSize` ref | ✅ 已迁移 |
| 11 | 悔棋次数选择 | `undoLimit` (1/3/5/999) | `undoLimit` ref | ✅ 已迁移 |
| 12 | 昵称验证 | `validateNickname()` | `validateNickname()` | ✅ 已迁移 |

## 三、人机对战设置面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 13 | 昵称输入 | `aiPlayerName` | `playerName` ref | ✅ 已迁移 |
| 14 | 执子颜色选择 | `aiPlayerColor` (1/2) | `playerColor` ref | ✅ 已迁移 |
| 15 | AI难度选择 | `aiDifficulty` (easy/medium/hard) | `difficulty` ref | ✅ 已迁移 |
| 16 | 棋盘大小选择 | `aiBoardSize` | `boardSize` ref | ✅ 已迁移 |
| 17 | 对局时长选择 | `aiGameTime` | `gameTime` ref | ✅ 已迁移 |
| 18 | AI模式悔棋无限 | `undoLimit=999` | ❌ 未设置，仍用默认值3 | ⚠️ 缺失 |

## 四、在线对战面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 19 | 昵称输入 | `onlineNickname` | `nickname` ref | ✅ 已迁移 |
| 20 | 创建房间按钮 | `showCreateRoom()` | `@create-room` | ✅ 已迁移 |
| 21 | 房间列表刷新 | `refreshRoomList()` | `@refresh-room-list` | ✅ 已迁移 |
| 22 | 房间列表显示 | `handleRoomList()` | `updateRoomList()` | ✅ 已迁移 |
| 23 | 手动输入房间码 | `manualRoomCode` + `joinRoomByCode()` | `manualRoomCode` + `joinRoomByCode()` | ✅ 已迁移 |
| 24 | 选择房间（有/无密码） | `selectRoom()` | `selectRoom()` | ✅ 已迁移 |

## 五、创建房间面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 25 | 房间密码输入 | `createRoomPassword` | `password` ref | ✅ 已迁移 |
| 26 | 对局时长选择 | `onlineGameTime` (0/300/600) | `gameTime` ref | ✅ 已迁移 |
| 27 | 棋盘大小选择 | `onlineBoardSize` | `boardSize` ref | ✅ 已迁移 |
| 28 | 比赛模式选择 | `matchMode` (1/3/5) | `matchMode` ref | ✅ 已迁移 |
| 29 | 悔棋次数选择 | `onlineUndoLimit` (1/3/5) | `undoLimit` ref | ✅ 已迁移 |

## 六、等待对手面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 30 | 房间码显示 | `displayRoomCode` | `roomCode` prop | ✅ 已迁移 |
| 31 | 密码提示显示 | `roomPasswordHint` | `password` prop | ✅ 已迁移 |
| 32 | 等待动画 | CSS `waiting-dots` | CSS `waiting-dots` | ✅ 已迁移 |
| 33 | 取消等待 | `cancelWaiting()` → `ws.close()` | `cancelWaiting()` → `wsStore.leaveRoom()` | ✅ 已迁移 |

## 七、密码输入面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 34 | 房间码显示 | `passwordRoomCode` | `roomCode` prop | ✅ 已迁移 |
| 35 | 密码输入 | `joinRoomPassword` | `password` ref | ✅ 已迁移 |
| 36 | 加入/取消按钮 | `submitPassword()` / `closePanel()` | `@submit` / `@cancel` | ✅ 已迁移 |

## 八、游戏棋盘

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 37 | SVG棋盘网格渲染 | DOM操作创建SVG | Vue模板SVG | ✅ 已迁移 |
| 38 | 星位绘制 | 15/19/13三种棋盘 | computed `starPoints` | ✅ 已迁移 |
| 39 | 响应式缩放 | `window.resize` + 重新渲染 | `window.resize` + computed scale | ✅ 已迁移 |
| 40 | 点击落子（预览+确认） | `handleCellClick` → `showPreview` / `confirmPlacePiece` | `handleCellClick` → `previewCell` | ✅ 已迁移 |
| 41 | 棋子渲染（黑/白） | `updateCell()` DOM操作 | Vue模板 `v-if` 条件渲染 | ✅ 已迁移 |
| 42 | 最后一手标记 | `.last-move` CSS | `isLastMove()` | ✅ 已迁移 |
| 43 | 胜利连线高亮 | `.winning` CSS + `highlightWinningLine()` | `isWinningCell()` | ✅ 已迁移 |
| 44 | 棋子序号显示 | `toggleMoveNumbers()` / `toggleMoveNumbersDisplay()` | `showMoveNumbers` + `getMoveNumber()` | ✅ 已迁移 |
| 45 | 在线模式禁止对方回合落子 | `currentPlayer !== myColor` | 同样逻辑 | ✅ 已迁移 |

## 九、玩家信息显示

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 46 | 对手信息（棋盘上方） | `opponentInfo` div | `PlayerInfo` component | ✅ 已迁移 |
| 47 | 己方信息（棋盘下方） | `myInfo` div | `PlayerInfo` component | ✅ 已迁移 |
| 48 | 颜色图标 | `⚫`/`⚪` | `colorIcon` computed | ✅ 已迁移 |
| 49 | 计时器显示 | `myTime`/`opponentTime` | `formatTime()` | ✅ 已迁移 |
| 50 | 落子数显示 | `myMoves`/`opponentMoves` | `player.moves` | ✅ 已迁移 |
| 51 | 悔棋次数显示 | `myUndo`/`opponentUndo` | `player.undoLeft` | ✅ 已迁移 |
| 52 | 当前回合高亮 | `.active` class | `isCurrentTurn` prop | ✅ 已迁移 |
| 53 | AI思考状态显示 | `oppNameElement.textContent = 'AI 🤔'` | ❌ 未迁移 | ⚠️ 缺失 |
| 54 | 计时器警告/危险颜色 | CSS class切换 | `time-warning`/`time-danger` class | ✅ 已迁移 |

## 十、控制按钮

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 55 | 准备按钮（在线模式） | `readyBtn` + `sendReady()` | `@ready` → `handleReady()` | ✅ 已迁移 |
| 56 | 悔棋按钮 | `undoBtn` + `requestUndo()` | `@undo` → `handleUndo()` | ✅ 已迁移 |
| 57 | 认输按钮 | `surrender()` | `@surrender` → `handleSurrender()` | ✅ 已迁移 |
| 58 | 再来一局按钮 | `restartBtn` + `playAgain()` | `@play-again` → `handlePlayAgain()` | ✅ 已迁移 |
| 59 | 显示/隐藏序号按钮 | `toggleMoveNumbersDisplay()` | `@toggle-numbers` | ✅ 已迁移 |
| 60 | 导出棋谱按钮 | `exportGame()` | `@export-game` → `gameStore.exportGame()` | ✅ 已迁移 |
| 61 | 退出房间按钮 | `exitRoom()` | `@exit-room` → `handleExitRoom()` | ✅ 已迁移 |
| 62 | 在线模式按钮状态切换 | `updateUI()` 中复杂逻辑 | 部分迁移，简化了 | ⚠️ 不完整 |
| 63 | 导出按钮游戏进行中置灰 | `btn.disabled = isPlaying` | `v-if="!isPlaying"` | ✅ 已迁移 |

## 十一、快捷消息与表情

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 64 | 快捷消息栏 | `chatBar` (4条消息) | `chat-bar` (4条消息) | ✅ 已迁移 |
| 65 | 表情弹窗 | `emojiPopup` (12个表情) | `emoji-popup` (12个表情) | ✅ 已迁移 |
| 66 | 表情弹窗切换 | `toggleEmojiPopup()` | `@toggle-emoji` | ✅ 已迁移 |
| 67 | 点击外部关闭表情 | `document.addEventListener('click')` | `handleClickOutside` | ✅ 已迁移 |
| 68 | 发送快捷消息 | `sendQuickMsg()` → `sendToServer` | `@quick-msg` → `wsStore.sendQuickMsg` | ✅ 已迁移 |
| 69 | 发送表情 | `sendEmoji()` → `sendToServer` | `@send-emoji` → `wsStore.sendEmoji` | ✅ 已迁移 |
| 70 | 表情动画显示 | `showEmojiAnimation()` → toast | 仅 toast，无动画 | ⚠️ 简化 |
| 71 | 非在线模式隐藏聊天栏 | `chatBar.style.display = 'none'` | `v-if="gameMode === 'online'"` | ✅ 已迁移 |

## 十二、游戏核心逻辑

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 72 | 初始化游戏 | `initGame()` | `gameStore.startGame()` | ✅ 已迁移 |
| 73 | 落子逻辑 | `doPlacePiece()` | `gameStore.doPlacePiece()` | ✅ 已迁移 |
| 74 | 胜负检测 | `checkWin()` | `gameStore.checkWin()` | ✅ 已迁移 |
| 75 | 平局检测 | 棋盘满 | 棋盘满 | ✅ 已迁移 |
| 76 | 延迟显示结果（2秒） | `isEnding` + `setTimeout` | `isEnding` + `setTimeout` | ✅ 已迁移 |
| 77 | 比分更新 | `matchWins[player]++` | `matchWins[player]++` | ✅ 已迁移 |
| 78 | 比赛结束判定 | `matchEnded` | `matchEnded` | ✅ 已迁移 |
| 79 | 交换先后手再来一局 | `playAgain()` 交换 `myColor`/`aiColor` | `swapColorsAndRestart()` | ✅ 已迁移 |
| 80 | 游戏结束自动显示序号 | `showMoveNumbers = true` | `showMoveNumbers = true` | ✅ 已迁移 |

## 十三、AI系统

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 81 | Web Worker AI计算 | `aiWorker.postMessage()` | `useAI.ts` → `makeMove()` | ✅ 已迁移 |
| 82 | AI请求ID防过期 | `aiRequestCounter` + `currentAiRequestId` | `aiRequestCounter` + `currentAiRequestId` | ✅ 已迁移 |
| 83 | AI思考时间扣除 | `thinkTime` 扣除 AI 时间 | `useAI.ts` 中实现 | ✅ 已迁移 |
| 84 | AI超时判负 | 检查 `time <= 0` | `useAI.ts` 中实现 | ✅ 已迁移 |
| 85 | 主线程降级计算 | `computeAIMoveMain()` | ❌ 未迁移 | ⚠️ 缺失 |
| 86 | AI先手自动落子 | `setTimeout(makeAIMove, 300)` | `setTimeout(aiMakeMove, 300)` | ✅ 已迁移 |
| 87 | AI落子后触发 | `doPlacePiece` 末尾 `setTimeout(makeAIMove, 300)` | `watch(isAiTurn)` | ✅ 已迁移 |
| 88 | AI Worker错误处理 | `onerror` 降级主线程 | `onerror` 仅 console.error | ⚠️ 简化 |
| 89 | AI时间限制配置 | `aiEngine.depthMap[difficulty].timeLimit` | 硬编码 `timeLimits` 字典 | ⚠️ 简化 |

## 十四、悔棋系统

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 90 | 本地模式直接悔棋 | `doUndo()` | `gameStore.undo()` | ✅ 已迁移 |
| 91 | AI模式悔两步 | 悔AI+悔玩家 | `gameStore.doUndo()` | ✅ 已迁移 |
| 92 | 在线模式请求悔棋 | `sendToServer({type:'undo_request'})` | `wsStore.requestUndo()` | ✅ 已迁移 |
| 93 | 在线悔棋请求弹窗 | `undoRequestModal` | `UndoRequestModal.vue` | ✅ 已迁移 |
| 94 | 同意/拒绝悔棋 | `acceptUndo()`/`rejectUndo()` | `@accept`/`@reject` | ✅ 已迁移 |
| 95 | 悔棋次数限制检查 | `undoLeft <= 0` | `canUndo` computed | ✅ 已迁移 |
| 96 | 在线模式只能悔自己的棋 | `lastMove.player !== myColor` | `canUndo` 中 `isMyTurn` | ⚠️ 逻辑差异 |
| 97 | 悔棋后标记新最后一手 | `prevCell.querySelector('.piece').classList.add('last-move')` | Vue响应式自动处理 | ✅ 已迁移 |

## 十五、计时器

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 98 | 计时器启动 | `startTimer()` | `gameStore.startTimer()` | ✅ 已迁移 |
| 99 | 计时器停止 | `stopTimer()` | `gameStore.stopTimer()` | ✅ 已迁移 |
| 100 | 超时判负 | `time <= 0` → `endGame()` | `time <= 0` → `endGame()` | ✅ 已迁移 |
| 101 | 仅当前玩家计时 | `players[currentPlayer].time--` | 同样逻辑 | ✅ 已迁移 |

## 十六、认输

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 102 | 确认对话框 | `confirm('确定要认输吗？')` | `confirm()` | ✅ 已迁移 |
| 103 | 在线模式发送服务器 | `sendToServer({type:'surrender'})` | `wsStore.surrender()` | ✅ 已迁移 |
| 104 | 本地/AI模式直接判负 | `endGame(对手)` | `gameStore.endGame(对手)` | ✅ 已迁移 |

## 十七、胜利弹窗

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 105 | 胜利者名称显示 | `winnerName.textContent` | `winnerName` computed | ✅ 已迁移 |
| 106 | 平局显示 | `winnerName = '平局!'` | `winnerText` computed | ✅ 已迁移 |
| 107 | 比赛结果文本 | `matchResult.textContent` | `matchResult` prop | ✅ 已迁移 |
| 108 | 准备状态显示 | `readyStatus` div | `readyStatus` prop | ✅ 已迁移 |
| 109 | 准备按钮（下一局/再赛一轮） | `modalReadyBtn` 动态文本 | `readyButtonText` computed | ✅ 已迁移 |
| 110 | 查看棋谱按钮 | `closeWinModal()` | `@close` | ✅ 已迁移 |
| 111 | 在线模式准备按钮状态 | `handlePlayAgainStatus()` 更新 | ❌ 未完整迁移 | ⚠️ 不完整 |

## 十八、在线对战 - WebSocket消息处理

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 112 | `room_created` | `handleRoomCreated()` | ✅ 已迁移 | ✅ |
| 113 | `room_joined` | `handleRoomJoined()` | ✅ 已迁移 | ✅ |
| 114 | `opponent_joined` | `handleOpponentJoined()` | ✅ 已迁移 | ✅ |
| 115 | `room_list` | `handleRoomList()` | ✅ 已迁移 | ✅ |
| 116 | `piece_placed` | `handlePiecePlaced()` | ✅ 已迁移 | ✅ |
| 117 | `game_over` | `handleGameOver()` | ⚠️ 简化，缺少 `winningMove` 处理 | ⚠️ 不完整 |
| 118 | `opponent_left` | `handleOpponentLeft()` | ✅ 已迁移 | ✅ |
| 119 | `opponent_disconnected` | `handleOpponentDisconnected()` | ✅ 已迁移 | ✅ |
| 120 | `opponent_reconnected` | `handleOpponentReconnected()` | ✅ 已迁移 | ✅ |
| 121 | `undo_request` | `handleUndoRequest()` | ✅ 已迁移 | ✅ |
| 122 | `undo_accepted` | `handleUndoAccepted()` | ✅ 已迁移 | ✅ |
| 123 | `undo_rejected` | toast | ✅ 已迁移 | ✅ |
| 124 | `play_again` | `handlePlayAgain()` | ⚠️ 简化，缺少玩家数据更新 | ⚠️ 不完整 |
| 125 | `play_again_status` | `handlePlayAgainStatus()` | ❌ 未迁移 | ⚠️ 缺失 |
| 126 | `quick_msg` | toast | ✅ 已迁移 | ✅ |
| 127 | `emoji` | `showEmojiAnimation()` | ✅ toast | ✅ |
| 128 | `rejoined` | `handleRejoined()` | ❌ 未迁移 | ⚠️ 缺失 |
| 129 | `room_expired` | `handleRoomExpired()` | ✅ 已迁移 | ✅ |
| 130 | `error` | alert | ✅ toast | ✅ |
| 131 | 心跳检测 | `ping`/`pong` | `startPing()` 30秒间隔 | ✅ 已迁移 |
| 132 | 断线重连 | `showReconnect()` + 自动重连 | 自动重连，无重连UI | ⚠️ 简化 |
| 133 | 重连overlay | `reconnectOverlay` | ❌ 未迁移 | ⚠️ 缺失 |

## 十九、导出棋谱

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 134 | Canvas绘制棋盘 | `exportGame()` | `gameStore.exportGame()` | ✅ 已迁移 |
| 135 | 棋子+序号绘制 | 同上 | 同上 | ✅ 已迁移 |
| 136 | PNG下载 | `link.click()` | `link.click()` | ✅ 已迁移 |

## 二十、对局记录

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 137 | 保存对局记录 | `saveGameHistory()` → localStorage | `gameStore.saveGameHistory()` | ✅ 已迁移 |
| 138 | 加载对局记录 | `loadGameHistory()` | `loadHistory()` | ✅ 已迁移 |
| 139 | 显示对局列表 | `renderHistory()` | Vue模板 `v-for` | ✅ 已迁移 |
| 140 | 清空记录 | `clearHistory()` | `clearHistory()` | ✅ 已迁移 |
| 141 | 最多50条记录 | `history.length > 50` | 同样逻辑 | ✅ 已迁移 |

## 二十一、游戏规则面板

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 142 | 规则内容显示 | HTML静态内容 | `RulesPanel.vue` | ✅ 已迁移 |
| 143 | 关闭规则面板 | `closeRules()` | `@close` | ✅ 已迁移 |

## 二十二、比分显示

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 144 | 比赛模式比分显示 | `scoreDisplay` div | `score-display` div | ✅ 已迁移 |
| 145 | 局数显示 | `matchInfo` | `match-info` | ✅ 已迁移 |
| 146 | 按视角显示比分 | `isHost` 判断 | ❌ 未按视角显示 | ⚠️ 不完整 |

## 二十三、其他

| # | 功能 | 原HTML | Vue项目 | 状态 |
|---|------|--------|---------|------|
| 147 | Toast消息 | `showToast()` 动态创建DOM | `Toast.vue` 组件 | ✅ 已迁移 |
| 148 | 返回菜单清理 | `backToMenu()` 清理所有状态 | `handleExitRoom()` + `gameStore.backToMenu()` | ✅ 已迁移 |
| 149 | 在线模式 `gameTime` 选项 | 0/300/600 (无3分钟) | 0/300/600 | ✅ 已迁移 |
| 150 | 在线模式 `undoLimit` 选项 | 1/3/5 (无无限) | 1/3/5 | ✅ 已迁移 |

---

## ⚠️ 缺失/不完整项汇总

| # | 缺失项 | 严重程度 | 说明 |
|---|--------|---------|------|
| 1 | **URL参数自动加入房间** (`?room=xxx`) | 中 | 原HTML支持URL参数自动打开在线面板并填入房间码，Vue项目未实现 |
| 2 | **AI模式悔棋无限** (`undoLimit=999`) | 高 | 原HTML中AI模式设置 `undoLimit=999`，Vue项目未设置，AI模式悔棋次数受限 |
| 3 | **AI思考状态显示** | 低 | 原HTML在对手名后显示🤔，Vue项目PlayerInfo未实现此功能 |
| 4 | **主线程AI降级计算** | 低 | 原HTML在不支持Worker时降级到主线程，Vue项目未实现 |
| 5 | **`play_again_status` 消息处理** | 高 | 原HTML有完整准备状态双向更新逻辑（对手已准备/双方已准备等），Vue项目完全缺失 |
| 6 | **`play_again` 消息完整处理** | 高 | 原HTML处理了玩家数据更新（颜色交换、名字更新），Vue项目仅 `resetGame()` |
| 7 | **`game_over` 消息 `winningMove` 处理** | 中 | 原HTML处理了服务器返回的 `winningMove`（在线模式落子同步），Vue项目未处理 |
| 8 | **断线重连UI** | 中 | 原HTML有 `reconnectOverlay` 显示重连中状态，Vue项目无 |
| 9 | **`rejoined` 消息处理** | 中 | 原HTML处理重连后恢复棋盘状态，Vue项目未实现 |
| 10 | **在线模式按钮状态完整逻辑** | 中 | 原HTML `updateUI()` 中有复杂的按钮显示/隐藏/禁用逻辑，Vue项目简化了 |
| 11 | **比分按视角显示** | 低 | 原HTML根据 `isHost` 切换比分显示视角，Vue项目直接显示1:2 |
| 12 | **表情动画** | 低 | 原HTML `showEmojiAnimation()` 显示颜色+表情，Vue项目仅toast |
| 13 | **AI时间限制从引擎获取** | 低 | 原HTML从 `aiEngine.depthMap` 获取，Vue项目硬编码 |

---

## 🐛 已修复Bug记录

| # | Bug | 修复方式 |
|---|-----|---------|
| 1 | 棋盘缩小消失 | ResizeObserver反馈循环 → 改用window.resize + computed scale |
| 2 | AI不落子（Worker被terminate） | 再来一局时重新initAI + setOnAITurn |
| 3 | AI不落子（DataCloneError） | Vue响应式Proxy数组无法postMessage → JSON.parse(JSON.stringify()) 转普通数组 |
| 4 | 再来一局不交换先后手 | 实现 swapColorsAndRestart() |
| 5 | 非在线模式显示表情/消息 | emoji-popup v-if 增加在线模式判断 |

---

## 迁移完成度统计

- ✅ **已完整迁移**: 130项 (86.7%)
- ⚠️ **不完整/简化**: 14项 (9.3%)
- ❌ **完全缺失**: 6项 (4.0%)

### 关键缺失项（影响在线对战功能）

1. `play_again_status` 消息处理（准备状态同步）
2. `play_again` 消息完整处理（玩家数据更新）
3. `game_over` 的 `winningMove` 处理
4. AI模式 `undoLimit=999`
5. 断线重连UI和 `rejoined` 消息处理
