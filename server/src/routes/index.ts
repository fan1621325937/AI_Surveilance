import { Router, type Request, type Response } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

/**
 * 基础健康检查
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "AI Video Surveillance API",
    mode: "Enterprise Layered Architecture",
  });
});

/**
 * 注册业务子路由
 */
router.use("/auth", authRoutes);

export default router;
