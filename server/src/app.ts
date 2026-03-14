import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import config from "./config/index.js";
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { csrfTokenProvider, csrfProtection } from "./middlewares/csrf.middleware.js";
import { RsaUtils } from "./utils/rsa.js";
import logger from "./utils/logger.js";
import prisma from "./models/prisma.js";
import redis from "./utils/redis.js";

const app = express();

// 开启代理 IP 信任 (支持限流与日志溯源)
app.set("trust proxy", 1);

const { PORT } = config.env;

// ============================
// 1. 基础安全与基础解析中间件
// ============================
app.use(requestIdMiddleware); // 请求 ID 链路追踪（必须第一个挂载）
app.use(cookieParser()); // Cookie 解析中间件
app.use(helmet()); // 基础安全头

// 跨域精细化控制 (白名单准入)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.system.cors_whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`Locked: CORS block for unauthorized origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json()); // JSON 解析中间件
app.use(express.urlencoded({ extended: true })); // URL 编码解析中间件

// ============================
// 2. CSRF 防护
// ============================
app.use(csrfTokenProvider); // CSRF Token 下发
app.use(csrfProtection); // CSRF Token 校验

// ============================
// 3. HTTP 请求日志（简化版，不依赖 pino-http）
// ============================
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const requestId = (req as any).requestId || "N/A";
    logger.info({
      msg: "HTTP Request",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId,
      ip: req.ip,
    });
  });
  next();
});

// ============================
// 4. 注入业务路由模块
// ============================
app.use(router);

// ============================
// 5. 全局错误捕获
// ============================
app.use(errorHandler);

// ============================
// 6. 启动服务 + 优雅关闭
// ============================
const startServer = async () => {
  // 预初始化 RSA 密钥对（异步，支持 Redis 缓存）
  await RsaUtils.initKeys();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 AI Surveillance Service is running on port ${PORT}`);
    logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
    logger.info(`📂 Config Mode: Enterprise Layered (YAML + .env)`);
  });

  // 优雅关闭：确保所有连接正常释放
  const gracefulShutdown = async (signal: string) => {
    logger.info(`⏹️ Received ${signal}, starting graceful shutdown...`);

    // 停止接受新连接
    server.close(async () => {
      logger.info("HTTP server closed.");

      try {
        // 断开数据库连接
        await prisma.$disconnect();
        logger.info("Database disconnected.");

        // 断开 Redis 连接
        redis.disconnect();
        logger.info("Redis disconnected.");
      } catch (err) {
        logger.error(err, "Error during shutdown cleanup");
      }

      logger.info("✅ Graceful shutdown complete.");
      process.exit(0);
    });

    // 超时强制退出（防止僵尸进程）
    setTimeout(() => {
      logger.error("⚠️ Shutdown timeout, forcing exit.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

startServer().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});

export default app;
