# 1. 基础镜像（构建阶段）
FROM node:20-alpine AS builder

WORKDIR /app

# 仅复制依赖清单（利用 Docker 缓存层）
COPY package*.json ./

# 安装全部依赖（含 devDependencies，用于编译）
RUN npm ci

# 复制源码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript
RUN npm run build

# 2. 生产运行镜像（精简体积）
FROM node:20-alpine AS production

WORKDIR /app

# 仅复制生产依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/config.yaml ./config.yaml

# 声明端口
EXPOSE 3000

# 非 root 用户运行（安全加固）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001
USER nodeuser

# 启动应用
CMD ["node", "dist/app.js"]
