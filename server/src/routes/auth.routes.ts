import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { CaptchaController } from "../controllers/captcha.controller.js";
import {
  loginIpRateLimiter,
  loginAccountRateLimiter,
} from "../middlewares/rate-limit.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * 获取 RSA 公钥
 * GET /auth/public-key
 */
router.get("/public-key", AuthController.getPublicKey);

/**
 * 获取验证码图片
 * GET /auth/captcha
 */
router.get("/captcha", CaptchaController.getCaptcha);

/**
 * 用户登录接口
 * POST /auth/login
 * 集成双维度限流：IP 限流 + 账号名限流
 */
router.post(
  "/login",
  loginIpRateLimiter,
  loginAccountRateLimiter,
  AuthController.login,
);

/**
 * 刷新 Token
 * POST /auth/refresh
 */
router.post("/refresh", AuthController.refresh);

/**
 * 退出登录（需鉴权）
 * POST /auth/logout
 */
router.post("/logout", authMiddleware, AuthController.logout);

export default router;
