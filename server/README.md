# 五子棋在线对战服务器

WebSocket 服务器，用于五子棋在线对战。

## 📚 相关文档

| 文档名称 | 说明 |
|---------|------|
| **项目上下文** | [../AGENTS.md](../AGENTS.md) - 项目概述、技术栈、开发约定 |
| **代码分析** | [../代码分析文档.md](../代码分析文档.md) - 详细代码实现分析、WebSocket 操作详解 |
| **问题记录** | [../问题记录与解决方案.md](../问题记录与解决方案.md) - 已知问题、bug 修复记录 |
| **项目说明** | [../README.md](../README.md) - 项目简介、快速开始、部署指南 |
| **前端文档** | [../frontend/README.md](../frontend/README.md) - 前端开发文档、构建、部署 |

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **操作系统**: Windows、macOS、Linux

检查 Node.js 版本：
```bash
node --version
```

### 安装依赖

```bash
npm install
```

### 启动方式

#### 方式一：本地运行（推荐用于开发）

```bash
npm start
```

**默认配置**：
- 端口：8080
- WebSocket 地址：`ws://localhost:8080`
- 日志级别：info

**修改端口**：
```bash
# Windows PowerShell
$env:PORT=9000; npm start

# Linux/macOS
PORT=9000 npm start
```

#### 方式二：开发模式（支持自动重启）

```bash
npm run dev
```

**说明**：
- 使用 nodemon 监听文件变化
- 文件修改后自动重启服务器
- 适用于开发调试

#### 方式三：使用后台任务（适用于 AI 自动化）

```powershell
# Windows PowerShell - 后台运行
cd server; npm start

# Linux/macOS - 后台运行
cd server && npm start &
```

#### 方式四：Docker 运行

```bash
# 构建镜像
docker build -t gomoku-backend -f ../docker/Dockerfile --target backend ..

# 运行容器
docker run -d -p 8080:8080 --name gomoku-backend gomoku-backend
```

**说明**：
- 使用 Docker 容器化部署
- 端口映射：8080:8080
- 适用于生产环境

### 启动验证

**检查端口占用**：
```bash
# Windows PowerShell
netstat -ano | findstr :8080

# Linux/macOS
lsof -i :8080
# 或
netstat -tulpn | grep :8080
```

**测试连接**：
```bash
# 使用 curl 测试（WebSocket 协议）
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:8080
```

**查看日志**：
服务器启动后会显示：
```
Gomoku WebSocket Server running on port 8080
```

### 停止服务器

**方式一：使用 Ctrl+C**
- 在启动服务器的终端窗口按 `Ctrl+C`

**方式二：查找并终止进程**
```powershell
# Windows PowerShell
# 查找进程
netstat -ano | findstr :8080
# 终止进程（使用上面查到的 PID）
taskkill /PID <进程ID> /F

# Linux/macOS
# 查找进程
lsof -i :8080
# 终止进程
kill -9 <进程ID>
```

**⚠️ 重要提示**：
- ❌ 不要使用 `taskkill /F /IM node.exe`（会杀掉所有 Node.js 进程）
- ❌ 不要使用 `killall node`（会杀掉所有 Node.js 进程）
- ✅ 应该先查找对应端口的 PID，然后只终止该进程

### 常见问题

**Q: 端口 8080 被占用怎么办？**
A: 修改端口或终止占用端口的进程：
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <进程ID> /F

# Linux/macOS
lsof -i :8080
kill -9 <进程ID>
```

**Q: 依赖安装失败怎么办？**
A: 尝试清理缓存后重新安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: 服务器启动失败怎么办？**
A: 检查 Node.js 版本和端口占用：
```bash
node --version
netstat -ano | findstr :8080  # Windows
lsof -i :8080                   # Linux/macOS
```

**Q: 如何查看实时日志？**
A: 服务器启动后会在终端显示实时日志，包括：
- 房间创建/加入
- 玩家连接/断线
- 落子操作
- 游戏结束

---

## 📦 部署到 Railway

### 方式一：Railway CLI

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 进入服务器目录
cd server

# 部署
railway up
```
### 方式二：从 GitHub 部署

1. 打开 Railway Dashboard (https://railway.com)
2. 创建新项目
3. 选择 "Deploy from GitHub repo"
4. 选择 `gomoku-game` 仓库
5. 设置 Root Directory 为 `server`
6. Railway 会自动检测并部署

### 环境变量

无需设置，默认端口 8080。

## 更新前端 WebSocket 地址

部署后，将 Railway 提供的域名更新到 `index.html` 中的 `WS_SERVER` 变量：

```javascript
const WS_SERVER = 'wss://你的服务域名.up.railway.app';
```

## API 说明

### 消息类型

| 类型 | 方向 | 说明 |
|------|------|------|
| `create_room` | 客户端→服务器 | 创建房间 |
| `join_room` | 客户端→服务器 | 加入房间 |
| `get_room_list` | 客户端→服务器 | 获取房间列表 |
| `place_piece` | 客户端→服务器 | 落子 |
| `surrender` | 客户端→服务器 | 认输 |
| `room_created` | 服务器→客户端 | 房间创建成功 |
| `room_joined` | 服务器→客户端 | 成功加入房间 |
| `opponent_joined` | 服务器→客户端 | 对手加入 |
| `room_list` | 服务器→客户端 | 房间列表 |
| `piece_placed` | 服务器→客户端 | 落子同步 |
| `game_over` | 服务器→客户端 | 游戏结束 |
| `opponent_left` | 服务器→客户端 | 对手离开 |
| `error` | 服务器→客户端 | 错误消息 |
