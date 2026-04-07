# ==================== 前端构建 ====================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 复制前端文件
COPY index.html ai.js ai-worker.js ./

# 前端是静态文件，无需构建，直接使用 nginx 托管
FROM nginx:alpine AS frontend

# 设置正确的文件权限
RUN chmod 644 /etc/nginx/mime.types

# 复制前端静态文件到 nginx
COPY --from=frontend-builder /app/index.html /usr/share/nginx/html/index.html
COPY --from=frontend-builder /app/ai.js /usr/share/nginx/html/ai.js
COPY --from=frontend-builder /app/ai-worker.js /usr/share/nginx/html/ai-worker.js

# 设置文件权限
RUN chmod 644 /usr/share/nginx/html/* && \
    chown -R nginx:nginx /usr/share/nginx/html

# 替换 WS_SERVER 为使用 nginx 代理的相对路径
RUN sed -i "s|'wss://gomoku-server-production-722d.up.railway.app'|'/ws'|g" /usr/share/nginx/html/index.html

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