# 五子棋在线对战平台 - 项目上下文

## 📚 相关文档

本项目包含以下文档，方便开发和维护：

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| **项目上下文** | [AGENTS.md](./AGENTS.md) | 本文档，项目概述、技术栈、开发约定 |
| **代码分析** | [代码分析文档.md](./代码分析文档.md) | 详细代码实现分析、算法详解、对战模式逻辑 |
| **问题记录** | [问题记录与解决方案.md](./问题记录与解决方案.md) | 已知问题、bug 修复记录、解决方案 |
| **迁移清单** | [frontend/MIGRATION_CHECKLIST.md](./frontend/MIGRATION_CHECKLIST.md) | 从 HTML 迁移到 Vue 3 的完整检查清单 |
| **项目说明** | [README.md](./README.md) | 项目简介、快速开始、部署指南 |
| **前端文档** | [frontend/README.md](./frontend/README.md) | 前端开发文档、构建、部署 |
| **服务器文档** | [server/README.md](./server/README.md) | 服务器 API 文档、部署配置 |

---

## 项目概述

一个功能完整的五子棋在线对战平台，支持本地对战、人机对战和在线多人对战。项目采用前后端分离架构，**前端已升级为 Vue 3 + TypeScript + Vite 现代化架构**，后端使用 Node.js + WebSocket 提供实时通信服务。

### 核心特性

- **多种游戏模式**：本地对战、人机对战、在线对战
- **丰富的游戏功能**：计时系统、悔棋、比赛模式、快捷消息、表情互动
- **智能 AI**：基于 Alpha-Beta 剪枝算法的围棋 AI，支持多难度设置
- **实时通信**：WebSocket 实现在线对战的双向通信
- **现代化界面**：响应式设计，支持移动端和桌面端
- **对局记录**：保存历史对局，支持导出棋谱为 PNG 图片

## 技术栈

### 前端
- **框架**：Vue 3.4+ (Composition API)
- **构建工具**：Vite 5.x
- **类型支持**：TypeScript 5.x
- **状态管理**：Pinia 2.2+
- **样式**：CSS3（Flexbox、Grid、动画、渐变）
- **Web Worker**：后台线程执行 AI 计算，避免阻塞 UI
- **WebSocket API**：与服务器实时通信

### 后端
- **Node.js**：JavaScript 运行时环境（>= 18）
- **ws**：WebSocket 服务器库（^8.16.0）
- **uuid**：生成唯一标识符（^9.0.0）
- **crypto**：加密和哈希功能（内置模块）

### AI 引擎
- **算法**：Alpha-Beta 剪枝 + 迭代加深 + PVS（主变搜索）
- **优化技术**：Zobrist 置换表、历史启发、候选点剪枝、开局库
- **难度设置**：简单、中等、困难（搜索深度和时间限制不同）

### 部署
- **前端**：GitHub Pages（静态托管）、Docker（nginx）
- **后端**：Railway（云平台）、Docker（Node.js）
- **环境要求**：Node.js >= 18、Docker（可选）

## 项目结构

```
gomoku-game/
├── README.md           # 项目说明文档
├── AGENTS.md           # 项目上下文文档（本文件）
├── 代码分析文档.md      # 详细代码分析文档
├── 问题记录与解决方案.md # 问题记录和解决方案
├── .gitignore          # Git 忽略配置
├── docker/             # Docker 部署配置
│   ├── Dockerfile      # 多阶段构建配置
│   ├── nginx.conf      # Nginx 配置（前端托管 + WebSocket 代理）
│   └── docker-compose.yml  # 前后端服务编排
├── frontend/           # 前端模块目录（Vue 3 + TypeScript + Vite）
│   ├── src/
│   │   ├── main.ts           # 应用入口
│   │   ├── App.vue           # 根组件
│   │   ├── style.css         # 全局样式
│   │   ├── types/            # TypeScript 类型定义
│   │   │   └── game.ts       # 游戏相关类型
│   │   ├── stores/           # Pinia 状态管理
│   │   │   ├── game.ts       # 游戏状态 store
│   │   │   └── websocket.ts  # WebSocket 连接 store
│   │   ├── components/       # Vue 组件
│   │   │   ├── game/         # 游戏相关组件
│   │   │   │   ├── GameBoard.vue      # 棋盘组件
│   │   │   │   ├── GameControls.vue   # 游戏控制按钮
│   │   │   │   └── PlayerInfo.vue     # 玩家信息显示
│   │   │   ├── menu/         # 菜单相关组件
│   │   │   │   └── MenuScreen.vue     # 主菜单界面
│   │   │   ├── online/       # 在线对战组件
│   │   │   │   ├── OnlinePanel.vue          # 在线对战面板
│   │   │   │   ├── CreateRoomPanel.vue      # 创建房间面板
│   │   │   │   ├── WaitingPanel.vue         # 等待对手面板
│   │   │   │   ├── PasswordPanel.vue        # 密码输入面板
│   │   │   │   ├── LocalSetupPanel.vue      # 本地对战设置
│   │   │   │   └── AISetupPanel.vue         # 人机对战设置
│   │   │   ├── HistoryPanel.vue  # 对局记录面板
│   │   │   ├── RulesPanel.vue    # 游戏规则面板
│   │   │   ├── Toast.vue         # 消息提示组件
│   │   │   ├── UndoRequestModal.vue # 悔棋请求弹窗
│   │   │   └── WinModal.vue      # 胜利弹窗
│   │   ├── composables/      # 组合式函数
│   │   │   └── useAI.ts      # AI 逻辑封装
│   │   ├── workers/          # Web Worker
│   │   │   ├── ai.ts         # AI 引擎（TypeScript 版本）
│   │   │   └── ai-worker.ts  # Worker 包装器
│   │   └── assets/           # 静态资源
│   ├── public/               # 公共静态资源
│   │   ├── 404.html          # SPA 路由支持
│   │   ├── favicon.svg       # 网站图标
│   │   └── icons.svg         # 图标资源
│   ├── index.html            # HTML 入口
│   ├── package.json          # 前端依赖和脚本
│   ├── vite.config.ts        # Vite 配置
│   ├── tsconfig.json         # TypeScript 基础配置
│   ├── tsconfig.app.json     # TypeScript 应用配置
│   ├── tsconfig.node.json    # TypeScript Node 配置
│   ├── README.md             # 前端模块说明
│   ├── MIGRATION_CHECKLIST.md # 迁移清单
│   └── dist/                 # 构建输出目录
└── server/
    ├── server.js             # WebSocket 服务器（房间管理、落子同步等）
    ├── package.json          # 服务器依赖和脚本配置
    ├── railway.json          # Railway 部署配置
    └── README.md             # 服务器部署和 API 文档
└── oldweb.disabled/          # 旧版本前端（已弃用，仅保留用于参考）
    ├── index.html            # 原始前端单页应用（HTML + CSS + JS）
    ├── ai.js                 # 五子棋 AI 引擎（Alpha-Beta 剪枝算法）
    ├── ai-worker.js          # Web Worker 包装器
    └── 404.html              # SPA 路由支持
```

**当前版本**: v5.2.0 (Vue 3 重构版)

## 构建和运行

### 前端运行（推荐：Vue 3 版本）

#### 开发模式
```bash
cd frontend
npm install
npm run dev
```
访问 http://localhost:3000

#### 生产构建
```bash
cd frontend
npm run build
```

#### 类型检查 + 构建
```bash
cd frontend
npm run build:check
```

#### 预览构建结果
```bash
cd frontend
npm run preview
```

### 前端运行（旧版本：原始 HTML）

原始 HTML 版本已移至 `oldweb.disabled/` 文件夹，不再推荐使用。直接在浏览器中打开该文件夹中的 `index.html` 即可运行本地对战模式。

```bash
# 在项目根目录
start oldweb.disabled\index.html  # Windows
open oldweb.disabled/index.html   # macOS
xdg-open oldweb.disabled/index.html  # Linux
```

> ⚠️ 注意：旧版本已弃用，建议使用 Vue 3 版本进行开发和部署。

### 后端运行（在线对战）

#### 本地运行
```bash
cd server
npm install
npm start
```

服务器默认运行在 `ws://localhost:8080`。

#### 部署到 Railway

**方式一：Railway CLI**
```bash
npm i -g @railway/cli
railway login
cd server
railway up
```

**方式二：从 GitHub 部署**
1. 打开 Railway Dashboard (https://railway.com)
2. 创建新项目
3. 选择 "Deploy from GitHub repo"
4. 选择 `gomoku-game` 仓库
5. 设置 Root Directory 为 `server`
6. Railway 会自动检测并部署

**Railway 配置**
- `server/railway.json`：Railway 部署配置
- 使用 NIXPACKS 构建器
- 启动命令：`npm start`
- 重启策略：失败时自动重启，最多重试 10 次

### Docker 部署

**使用 Docker Compose（推荐）**
```bash
cd docker
docker-compose up -d
```

服务启动后：
- 前端访问：http://localhost:3000
- WebSocket：自动通过 nginx 代理到后端
- 局域网访问：http://192.168.1.xxx:3000

**手动构建和运行**
```bash
# 构建前端镜像
docker build --target frontend -t gomoku-frontend -f docker/Dockerfile ..

# 构建后端镜像
docker build --target backend -t gomoku-backend -f docker/Dockerfile ..

# 运行后端
docker run -d -p 8080:8080 --name gomoku-backend gomoku-backend

# 运行前端
docker run -d -p 3000:80 --link gomoku-backend:backend --name gomoku-frontend gomoku-frontend
```

**停止服务**
```bash
cd docker
docker-compose down
```

### WebSocket 服务器地址配置

Vue 3 前端会根据部署环境自动选择 WebSocket 服务器：

| 部署方式 | WebSocket 地址 | 说明 |
|---------|---------------|------|
| GitHub Pages | Railway 地址 | 使用默认 Railway 后端 |
| Railway | Railway 地址 | 使用 Railway 后端 |
| Docker | `/ws` (相对路径) | 通过 nginx 代理到本地后端 |
| URL 参数 | 自定义地址 | `?ws=ws://自定义地址` |

默认配置（`frontend/src/stores/websocket.ts`）：
```typescript
const WS_SERVER = new URLSearchParams(window.location.search).get('ws') ||
  (import.meta.env.GITHUB_PAGES ? 'wss://gomoku-game-production.up.railway.app' : '/ws');
```

Vite 构建时会自动替换 `import.meta.env.GITHUB_PAGES`，无需手动配置。

## 开发约定

### 代码风格
- 使用 2 空格缩进
- 使用单引号（JavaScript/TypeScript）
- 函数和类使用驼峰命名（camelCase）
- 常量使用大写下划线命名（UPPER_SNAKE_CASE）
- 注释使用 JSDoc 风格
- TypeScript 严格模式启用

### 文件组织
- **Vue 3 前端**：模块化架构，代码组织在 `frontend/src/` 目录
  - `components/`：按功能分类的 Vue 组件
  - `stores/`：Pinia 状态管理（game.ts、websocket.ts）
  - `composables/`：可复用的组合式函数
  - `workers/`：Web Worker（AI 计算）
  - `types/`：TypeScript 类型定义
- **AI 逻辑**：`frontend/src/workers/ai.ts`（TypeScript 版本）
- **服务器代码**：`server/server.js` 中
- **根目录文件**：保留原始版本用于参考

### WebSocket 消息格式

#### 客户端 → 服务器
- `create_room`：创建房间
- `join_room`：加入房间
- `get_room_list`：获取房间列表
- `rejoin_room`：重连房间
- `place_piece`：落子
- `undo_request`：悔棋请求
- `undo_accept`：接受悔棋
- `undo_reject`：拒绝悔棋
- `surrender`：认输
- `play_again`：再来一局
- `leave_room`：离开房间
- `quick_msg`：发送快捷消息
- `emoji`：发送表情
- `ping`：心跳检测

#### 服务器 → 客户端
- `room_created`：房间创建成功
- `room_joined`：成功加入房间
- `opponent_joined`：对手加入
- `room_list`：房间列表
- `piece_placed`：落子同步
- `game_over`：游戏结束
- `opponent_left`：对手离开
- `opponent_disconnected`：对手掉线
- `opponent_reconnected`：对手重连
- `rejoined`：重连成功
- `undo_request`：悔棋请求
- `undo_accepted`：悔棋接受
- `undo_rejected`：悔棋拒绝
- `quick_msg`：快捷消息
- `emoji`：表情
- `pong`：心跳响应
- `error`：错误消息
- `room_expired`：房间过期
- `server_shutdown`：服务器关闭通知

### AI 难度配置
AI 搜索深度和时间限制根据棋盘大小和难度动态调整：

| 难度 | 13×13 棋盘 | 15×15 棋盘 | 19×19 棋盘 |
|------|-----------|-----------|-----------|
| 简单 | 深度 3-5，500ms | 深度 2-3，600ms | 深度 2-3，700ms |
| 中等 | 深度 5-6，800ms | 深度 4-5，1000ms | 深度 3-4，1200ms |
| 困难 | 深度 7-8，1500ms | 深度 6-7，2000ms | 深度 4-5，2500ms |

### 游戏规则
- 黑方先行，双方轮流落子
- 棋子落在网格线的交点上
- 先将五颗棋子连成一线（横、竖、斜）者获胜
- 支持悔棋（本地对战直接悔棋，在线对战需对方同意）
- 超时判负
- 比赛模式支持单局决胜、三局两胜、五局三胜

### 环境变量
- **后端**：`PORT`（服务器端口，默认 8080）
- **前端**：`GITHUB_PAGES`（Vite 构建时自动设置，用于判断部署环境）

### 依赖管理
- **前端**：在 `frontend/package.json` 中管理
  - 核心依赖：`vue`、`pinia`
  - 开发依赖：`vite`、`typescript`、`@vitejs/plugin-vue`、`vue-tsc`
- **后端**：在 `server/package.json` 中管理
  - 核心依赖：`ws`、`uuid`

### Git 忽略配置 (.gitignore)
- `node_modules/`：Node.js 依赖目录
- `*.log`：日志文件
- `.idea/`, `.vscode/`：IDE 配置目录
- `.env*`：环境变量文件
- `dist/`, `build/`：构建输出目录
- `*.swp`, `*.swo`：临时文件
- `.DS_Store`, `Thumbs.db`：系统文件

## 核心功能实现

### Vue 3 状态管理架构

#### game.ts（游戏状态）
- **棋盘状态**：`board`、`boardSize`、`currentPlayer`
- **玩家信息**：`players`、`myColor`、`myName`、`opponentName`
- **游戏控制**：`isPlaying`、`isEnding`、`gameMode`、`matchMode`
- **计时系统**：`gameTime`、`timer`
- **悔棋系统**：`moveHistory`、`undoLimit`、`undoRequested`
- **AI 系统**：`aiColor`、`aiDifficulty`、`aiWorker`
- **在线对战**：`roomCode`、`isHost`、`myUserId`、`myPlayerIndex`
- **UI 状态**：`previewCell`、`showMoveNumbers`、`winningLine`

#### websocket.ts（WebSocket 连接）
- **连接管理**：`connect()`、`disconnect()`、自动重连
- **消息处理**：`setMessageHandler()`、发送各类消息
- **房间管理**：`createRoom()`、`joinRoom()`、`getRoomList()`
- **游戏操作**：`placePiece()`、`requestUndo()`、`surrender()`
- **社交功能**：`sendQuickMsg()`、`sendEmoji()`
- **心跳检测**：`startPing()`、`stopPing()`

### 房间管理
- 房间创建：生成 6 位随机房间码
- 房间加入：支持密码验证
- 房间过期：空闲房间 30 分钟后自动清理，已结束房间 5 分钟后清理
- 掉线重连：60 秒内可重连，超时判负

### 落子同步
- 实时同步落子位置
- 胜利连线检测
- 棋盘状态维护

### 悔棋系统
- 次数限制（1/3/5/无限）
- 在线对战需对方同意
- AI 模式悔两步（玩家 + AI）
- 记录悔棋次数

### AI 算法
- **搜索算法**：Alpha-Beta 剪枝 + PVS
- **置换表**：Zobrist 哈希，最大 50MB，支持冲突验证
- **历史启发**：记录走法历史，提高搜索效率
- **候选点剪枝**：只搜索已有棋子周围 2-3 格内的空位（终局扩大范围）
- **开局库**：支持花月、浦月等定式（前 8 步）
- **评估函数**：基于棋型评分（连五、活四、冲四、活三、眠三、跳三、跳四）
- **动态策略**：根据局势自动调整防守权重
- **Web Worker**：后台线程计算，避免阻塞 UI

### 对局记录
- 保存最近 50 局对局信息（LocalStorage）
- 导出棋谱为 PNG 图片（带序号）
- 显示比赛比分

## 常见问题

### 📖 文档相关

**Q: 想了解详细的代码实现和算法原理？**
A: 查看 [代码分析文档.md](./代码分析文档.md)，包含详细的代码实现分析、AI 算法详解、对战模式逻辑等。

**Q: 遇到问题或想知道已知的 bug？**
A: 查看 [问题记录与解决方案.md](./问题记录与解决方案.md)，记录了所有已知问题和解决方案。

**Q: 想了解从 HTML 迁移到 Vue 3 的过程？**
A: 查看 [frontend/MIGRATION_CHECKLIST.md](./frontend/MIGRATION_CHECKLIST.md)，完整的迁移检查清单。

**Q: 想了解前端或服务器的部署细节？**
A: 查看 [frontend/README.md](./frontend/README.md) 或 [server/README.md](./server/README.md)。

---

### 技术问题

### Q: 如何修改 WebSocket 服务器地址？
A: Docker 部署时自动配置，其他部署方式可通过 URL 参数覆盖：`?ws=ws://自定义地址`

### Q: Vue 3 版本和旧 HTML 版本有什么区别？
A: Vue 3 版本是现代化重构，使用组件化架构、TypeScript 类型安全、Pinia 状态管理，代码更易维护和扩展。旧版本已移至 `oldweb.disabled/` 文件夹，仅保留用于参考。

### Q: 如何切换到 Vue 3 版本？
A: 进入 `frontend` 目录，运行 `npm install` 和 `npm run dev` 即可。

### Q: AI 思考时间过长怎么办？
A: 降低 AI 难度设置，或减小棋盘大小。AI 时间限制会自动调整。

### Q: 如何添加新的 AI 难度？
A: 在 `frontend/src/workers/ai.ts` 中的 `getDepthConfig` 和 `getTimeLimitConfig` 方法中添加新的配置。

### Q: 房间码可以自定义吗？
A: 目前不支持，房间码由服务器随机生成 6 位字符。

### Q: 如何部署到其他平台？
A: 只要支持 WebSocket 的平台都可以部署，Docker 部署可直接使用，其他平台需要通过 URL 参数指定后端地址。

### Q: 前端构建失败怎么办？
A: 确保使用 Node.js >= 18，运行 `npm run build:check` 进行类型检查。

### Q: 如何调试 WebSocket 连接问题？
A: 打开浏览器开发者工具，查看 Network 标签页的 WebSocket 连接状态和控制台日志。

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 作者

upchr
