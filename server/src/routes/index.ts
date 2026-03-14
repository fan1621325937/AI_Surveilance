import { Router, type Request, type Response } from "express";
import authRoutes from "./auth.routes.js";
import prisma from "../models/prisma.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const router = Router();

/**
 * 深度健康检查
 * 不仅返回服务状态，还检测所有核心依赖的连通性
 */
router.get("/health", async (req: Request, res: Response) => {
  const checks: Record<string, unknown> = {
    status: "ok",
    service: "AI Video Surveillance API",
    mode: "Enterprise Layered Architecture",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  };

  let isHealthy = true;

  // 检测 MySQL 连通性
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "connected" };
  } catch (err) {
    checks.database = { status: "disconnected", error: (err as Error).message };
    isHealthy = false;
    logger.error(err, "Health check: Database unavailable");
  }

  // 检测 Redis 连通性
  try {
    const redisPong = await redis.ping();
    checks.redis = { status: redisPong === "PONG" ? "connected" : "error" };
  } catch (err) {
    checks.redis = { status: "disconnected", error: (err as Error).message };
    isHealthy = false;
    logger.error(err, "Health check: Redis unavailable");
  }

  checks.status = isHealthy ? "ok" : "degraded";
  res.status(isHealthy ? 200 : 503).json(checks);
});

/**
 * 注册业务子路由
 */
router.use("/auth", authRoutes);

export default router;
