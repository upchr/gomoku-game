# 五子棋在线对战服务器

WebSocket 服务器，用于五子棋在线对战。

## 部署到 Railway

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
