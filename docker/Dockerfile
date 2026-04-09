# ==================== 前端构建 ====================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 复制前端 package.json
COPY frontend/package*.json ./

# 安装依赖
RUN npm install

# 复制前端源代码
COPY frontend/tsconfig*.json ./
COPY frontend/vite.config.ts ./
COPY frontend/src ./src
COPY frontend/public ./public

# 构建 Vue 项目
RUN npm run build

# 使用 nginx 托管静态文件
FROM nginx:alpine AS frontend

# 设置正确的文件权限
RUN chmod 644 /etc/nginx/mime.types

# 复制构建产物到 nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# 设置文件权限
RUN chown -R nginx:nginx /usr/share/nginx/html

# 复制 nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

# ==================== 后端构建 ====================
FROM node:18-alpine AS backend

WORKDIR /app

# 复制 package.json
COPY server/package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制服务器代码
COPY server/*.js ./

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 启动服务器
CMD ["node", "server.js"]
