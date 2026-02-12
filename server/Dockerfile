# 1. 基础镜像：使用轻量级的 Node.js 20 镜像 (Alpine 版)
FROM node:20-alpine

# 2. 设置容器内的工作目录
WORKDIR /app

# 3. 复制依赖清单
# 这里的小技巧是先只复制 package*.json，这样如果只有代码变动，构建时会直接使用缓存的依赖层
COPY package*.json ./

# 4. 安装生产依赖
RUN npm install

# 5. 复制所有项目源码到容器中
COPY . .

# 6. 生成 Prisma 代码 (根据 schema.prisma 同步 Client)
RUN npx prisma generate

# 7. 编译 TypeScript 代码为原生 JavaScript
RUN npm run build

# 8. 声明容器运行时监听的端口
EXPOSE 3000

# 9. 启动应用
# 使用生产环境模式运行
CMD ["npm", "start"]
