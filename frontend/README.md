# 五子棋在线对战平台 (Vue 3 + Vite 版本)

一个功能完整的五子棋游戏，基于 Vue 3 + TypeScript + Vite 构建，支持本地对战、人机对战和在线对战。

## 📚 相关文档

| 文档名称 | 说明 |
|---------|------|
| **项目上下文** | [../AGENTS.md](../AGENTS.md) - 项目概述、技术栈、开发约定 |
| **代码分析** | [../代码分析文档.md](../代码分析文档.md) - 详细代码实现分析、算法详解 |
| **问题记录** | [../问题记录与解决方案.md](../问题记录与解决方案.md) - 已知问题、bug 修复记录 |
| **迁移清单** | [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) - 从 HTML 迁移到 Vue 3 的完整检查清单 |
| **项目说明** | [../README.md](../README.md) - 项目简介、快速开始、部署指南 |
| **服务器文档** | [../server/README.md](../server/README.md) - 服务器 API 文档 |

---

## ✨ 特性

### 游戏模式
- **本地对战**：双人同屏对弈
- **人机对战**：与 AI 对弈，多种难度选择
- **在线对战**：创建房间或加入房间，与好友远程对弈

### 技术栈
- **框架**：Vue 3.4+ (Composition API)
- **构建工具**：Vite 5.x
- **状态管理**：Pinia
- **类型支持**：TypeScript 5.x
- **AI 引擎**：Alpha-Beta 剪枝 + 迭代加深 + PVS

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

#### 方式一：开发模式（推荐用于本地开发）

```bash
npm run dev
```

**访问地址**：
- 本地访问：http://localhost:3000/
- 局域网访问：http://192.168.x.x:3000/（根据实际 IP）

**说明**：
- 使用 Vite 开发服务器
- 支持热模块替换（HMR）
- 实时编译，无需手动重启
- 适用于开发和调试

#### 方式二：生产构建（用于部署）

```bash
npm run build
```

**说明**：
- 生成优化的生产构建
- 输出目录：`dist/`
- 代码压缩和混淆
- 适用于部署到生产环境

#### 方式三：预览构建结果

```bash
npm run preview
```

**访问地址**：http://localhost:4173/

**说明**：
- 在本地预览生产构建结果
- 模拟生产环境运行
- 用于测试生产构建

#### 方式四：类型检查 + 构建（推荐用于发布前）

```bash
npm run build:check
```

**说明**：
- 先进行 TypeScript 类型检查
- 类型检查通过后再构建
- 确保代码质量

### 配置 WebSocket 服务器

**开发模式**：
- 默认连接：`ws://localhost:8080`
- 需要先启动后端服务器（见后端 README）

**生产环境**：
- GitHub Pages：自动连接 Railway 服务器
- Railway：自动连接 Railway 服务器
- Docker：通过 nginx 代理连接本地后端
- 自定义：使用 URL 参数 `?ws=ws://自定义地址`

### 常见问题

**Q: 端口 3000 被占用怎么办？**
A: 修改 `vite.config.ts` 中的端口配置，或使用命令行参数：
```bash
npm run dev -- --port 3001
```

**Q: 如何连接到自定义 WebSocket 服务器？**
A: 在 URL 中添加参数：
```
http://localhost:3000/?ws=ws://your-server:8080
```

**Q: 依赖安装失败怎么办？**
A: 尝试清理缓存后重新安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

**Q: 构建失败怎么办？**
A: 检查 TypeScript 类型错误：
```bash
npm run build:check
```

### 停止开发服务器

在终端窗口按 `Ctrl+C` 停止开发服务器。

## 📁 项目结构

```
gomoku-vue/
├── src/
│   ├── main.ts           # 应用入口
│   ├── App.vue           # 根组件
│   ├── types/            # TypeScript 类型定义
│   ├── stores/           # Pinia 状态管理
│   ├── services/         # 业务逻辑服务
│   ├── components/       # Vue 组件
│   ├── composables/      # 组合式函数
│   └── utils/            # 工具函数（含 AI 引擎）
├── public/
│   └── 404.html          # SPA 路由支持
├── .github/workflows/    # GitHub Actions 部署
└── vite.config.ts        # Vite 配置
```

## 🎮 游戏功能

- ⏱️ 计时系统（3/5/10分钟/不限）
- 🔄 悔棋功能（1/3/5次/无限）
- 🏆 比赛模式（单局/三局两胜/五局三胜）
- 💬 快捷消息 + 表情互动
- 🔢 落子序号显示
- 📸 导出棋谱（PNG 格式）

## 🤖 AI 引擎

- 🧠 Alpha-Beta 剪枝 + PVS（主变搜索）
- 📊 Zobrist 置换表（LRU 缓存 + 哈希冲突验证）
- 🎯 候选点剪枝（动态范围）
- 📚 开局库（9 种定式）
- ⚡ Web Worker（后台线程计算）

## 🌐 部署

### GitHub Pages
```bash
# 打标签触发自动部署
git tag v1.0.0
git push origin v1.0.0
```

访问：https://upchr.github.io/gomoku-vue/

### Railway
后端 WebSocket 服务器部署在 Railway，地址：`wss://gomoku-game-production.up.railway.app`

## 📄 许可证

MIT License

## 👤 作者

upchr
