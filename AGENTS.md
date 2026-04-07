# 五子棋在线对战平台 - 项目上下文

## 项目概述

一个功能完整的五子棋在线对战平台，支持本地对战、人机对战和在线多人对战。项目采用前后端分离架构，前端使用纯 HTML/CSS/JavaScript 实现单页应用，后端使用 Node.js + WebSocket 提供实时通信服务。

### 核心特性

- **多种游戏模式**：本地对战、人机对战、在线对战
- **丰富的游戏功能**：计时系统、悔棋、比赛模式、快捷消息、表情互动
- **智能 AI**：基于 Alpha-Beta 剪枝算法的围棋 AI，支持多难度设置
- **实时通信**：WebSocket 实现在线对战的双向通信
- **现代化界面**：响应式设计，支持移动端和桌面端
- **对局记录**：保存历史对局，支持导出棋谱为 PNG 图片

## 技术栈

### 前端
- **HTML5**：页面结构和语义化标签
- **CSS3**：现代 CSS 特性（Flexbox、Grid、动画、渐变）
- **Vanilla JavaScript**：原生 JavaScript，无框架依赖
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
- **前端**：GitHub Pages（静态托管）
- **后端**：Railway（云平台）
- **环境要求**：Node.js >= 18

## 项目结构

```
gomoku-game/
├── index.html          # 前端单页应用（包含 HTML、CSS、JavaScript）
├── ai.js               # 五子棋 AI 引擎（Alpha-Beta 剪枝算法）
├── ai-worker.js        # Web Worker 包装器（后台 AI 计算）
├── README.md           # 项目说明文档
├── AGENTS.md           # 项目上下文文档（本文件）
└── server/
    ├── server.js       # WebSocket 服务器（房间管理、落子同步等）
    ├── package.json    # 服务器依赖和脚本配置
    ├── railway.json    # Railway 部署配置
    └── README.md       # 服务器部署和 API 文档
```

## 构建和运行

### 前端运行（本地对战）
直接在浏览器中打开 `index.html` 即可运行本地对战模式。

```bash
# 在项目根目录
start index.html  # Windows
open index.html   # macOS
xdg-open index.html  # Linux
```

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

部署后，需要将 Railway 提供的域名更新到 `index.html` 中的 `WS_SERVER` 常量：

```javascript
const WS_SERVER = 'wss://你的服务域名.up.railway.app';
```

## 开发约定

### 代码风格
- 使用 2 空格缩进
- 使用单引号（JavaScript）
- 函数和类使用驼峰命名（camelCase）
- 常量使用大写下划线命名（UPPER_SNAKE_CASE）
- 注释使用 JSDoc 风格

### 文件组织
- 前端代码全部在 `index.html` 中（单文件架构）
- AI 逻辑在 `ai.js` 中独立实现
- Web Worker 在 `ai-worker.js` 中包装 AI 引擎
- 服务器代码在 `server/server.js` 中

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
| 简单 | 深度 3-5，200ms | 深度 2-4，200ms | 深度 2-3，300ms |
| 中等 | 深度 5-7，400ms | 深度 4-6，500ms | 深度 3-5，700ms |
| 困难 | 深度 7-9，800ms | 深度 6-8，1000ms | 深度 5-6，1500ms |

### 游戏规则
- 黑方先行，双方轮流落子
- 棋子落在网格线的交点上
- 先将五颗棋子连成一线（横、竖、斜）者获胜
- 支持悔棋（本地对战直接悔棋，在线对战需对方同意）
- 超时判负
- 比赛模式支持单局决胜、三局两胜、五局三胜

### 环境变量
- `PORT`：服务器端口（默认 8080）

### 依赖管理
- 前端无依赖，纯原生 JavaScript
- 后端依赖在 `server/package.json` 中管理

## 核心功能实现

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
- 记录悔棋次数

### AI 算法
- **搜索算法**：Alpha-Beta 剪枝 + PVS
- **置换表**：Zobrist 哈希，最大 50MB
- **历史启发**：记录走法历史，提高搜索效率
- **候选点剪枝**：只搜索已有棋子周围 2 格内的空位
- **开局库**：支持花月、浦月等定式
- **评估函数**：基于棋型评分（连五、活四、冲四、活三等）

### 对局记录
- 保存最近 50 局对局信息（LocalStorage）
- 导出棋谱为 PNG 图片（带序号）
- 显示比赛比分

## 常见问题

### Q: 如何修改 WebSocket 服务器地址？
A: 在 `index.html` 中找到 `const WS_SERVER = '...'` 并修改为你的服务器地址。

### Q: AI 思考时间过长怎么办？
A: 降低 AI 难度设置，或减小棋盘大小。AI 时间限制会自动调整。

### Q: 如何添加新的 AI 难度？
A: 在 `ai.js` 中的 `getDepthConfig` 和 `getTimeLimitConfig` 方法中添加新的配置。

### Q: 房间码可以自定义吗？
A: 目前不支持，房间码由服务器随机生成 6 位字符。

### Q: 如何部署到其他平台？
A: 只要支持 WebSocket 的平台都可以部署，主要需要修改 `index.html` 中的 `WS_SERVER` 地址。

## 版本历史

### v2.2.0 (2026-04-07)
- 菜单屏幕居中显示
- 添加游戏规则面板
- 游戏结束后显示落子序号
- 导出棋谱为 PNG 图片
- 五子连珠后延迟显示获胜结果
- 修复先后手交换逻辑

### v2.1.0
- 使用 SVG 绘制网格线，棋子精确落在交点
- 响应式缩放，手机端完整显示棋盘
- 修复棋盘居中对齐问题
- 添加星位点（天元、边星）

### v2.0.x
- 比赛模式（三局两胜/五局三胜）
- 悔棋次数限制
- 快捷消息和表情
- 断线重连
- 五子连珠高亮动画

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