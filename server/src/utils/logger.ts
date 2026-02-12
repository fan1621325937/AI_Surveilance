import pino, { type LoggerOptions } from "pino";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config/index.js";

// 兼容 ESM 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 企业级高性能日志系统 (Pino + Pino-Roll)
 * - 实时日志：控制台彩色输出 (开发模式)
 * - 持久化：自动滚动保存到 logs/app-yyyy-mm-dd.log
 */

const isProduction = process.env.NODE_ENV === "production";
const logDir = path.join(__dirname, "../../logs");

const transport = pino.transport({
  targets: [
    // 1. 控制台输出 (开发环境下使用 pino-pretty)
    {
      target: "pino-pretty",
      level: config.system.log_level || "info",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
    // 2. 本地文件滚动持久化
    {
      target: "pino-roll",
      level: config.system.log_level || "info",
      options: {
        file: path.join(logDir, "app.log"),
        frequency: "daily", // 每天切分一个新文件
        env: { TZ: "UTC" },
        mkdir: true,
      },
    },
  ],
});

const logger = pino(
  {
    level: config.system.log_level || "info",
  },
  transport,
);

export default logger;

// pino常用api
// pino.transport(options) //创建transport
// pino(level, transport) //创建logger
