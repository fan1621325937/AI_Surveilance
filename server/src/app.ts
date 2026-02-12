import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import config from "./config/index.js";
import router from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import logger from "./utils/logger.js";

const app = express();

// 开启代理 IP 信任 (支持限流与日志溯源)
app.set("trust proxy", 1);

const { PORT } = config.env;

// 1. 基础安全与基础解析中间件
app.use(cookieParser()); // Cookie 解析中间件
app.use(helmet()); // 基础安全头

// 跨域精细化控制 (白名单准入)
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许非浏览器的请求 (如 Postman) 或白名单内的域名
      if (!origin || config.system.cors_whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`Locked: CORS block for unauthorized origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // 必须开启以支持 HttpOnly Cookie
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json()); // JSON 解析中间件
app.use(express.urlencoded({ extended: true })); // URL 编码解析中间件

// 2. 注入业务路由模块
app.use(router);

// 3. 全局错误捕获
app.use(errorHandler);

// 4. 启动服务
app.listen(PORT, () => {
  logger.info(`🚀 AI Surveillance Service is running on port ${PORT}`);
  logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
  logger.info(`📂 Config Mode: Enterprise Layered (YAML + .env)`);
});

export default app;
