import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

/**
 * 全局 Prisma 数据库客户端 (企业级配置)
 *
 * 改进点：
 * 1. 开启查询日志事件监听
 * 2. 慢查询自动告警
 * 3. 连接错误日志记录
 */
const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "error", emit: "stdout" },
    { level: "warn", emit: "stdout" },
  ],
});

/** 慢查询阈值 (毫秒) */
const SLOW_QUERY_THRESHOLD = 1000;

// 监听查询事件，记录慢查询
prisma.$on("query", (e) => {
  if (e.duration > SLOW_QUERY_THRESHOLD) {
    logger.warn({
      msg: "⚠️ Slow Query Detected",
      duration: `${e.duration}ms`,
      query: e.query,
      params: e.params,
    });
  }
});

export default prisma;
