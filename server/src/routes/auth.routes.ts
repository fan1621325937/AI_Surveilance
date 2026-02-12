import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { CaptchaController } from "../controllers/captcha.controller.js";
import { loginRateLimiter } from "../middlewares/rate-limit.middleware.js";

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
 * 已集成 Redis 分布式限流防护
 */
router.post("/login", loginRateLimiter, AuthController.login);

/**
 * 退出登录
 * POST /auth/logout
 */
router.post("/logout", AuthController.logout);

export default router;
