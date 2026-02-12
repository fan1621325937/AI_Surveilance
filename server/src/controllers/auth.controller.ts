import { type Request, type Response, type NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { RsaUtils } from "../utils/rsa.js";
import { JwtUtils } from "../utils/jwt.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";
import config from "../config/index.js";

/**
 * 身份认证控制器
 */
export class AuthController {
  /**
   * 获取 RSA 公钥
   */
  static getPublicKey(req: Request, res: Response) {
    const publicKey = RsaUtils.getPublicKey();
    res.json({ publicKey });
  }

  /**
   * 处理登录请求 (适配 RSA 解密与 HttpOnly Cookie)
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. 执行登录逻辑 (全量透传 Body + IP + UA，由策略层动态处理)
      const result = await AuthService.login({
        ...req.body,
        clientIp: req.ip || req.socket.remoteAddress || "0.0.0.0",
        userAgent: req.headers["user-agent"] || "Unknown",
      });

      // 4. 将 Token 写入 HttpOnly Cookie
      res.cookie("Admin-Token", result.token, {
        httpOnly: true, // 防止 JS 读取 (防御 XSS)
        secure: process.env.NODE_ENV === "production", // 仅在 HTTPS 下传输
        sameSite: "lax", // 补强：跨站请求伪造 (CSRF) 防御，Lax 兼顾安全与导航体验
        maxAge: 24 * 60 * 60 * 1000, // 24小时有效 (与 JWT 同步)
      });

      // 5. 返回用户信息 (不再包含 Token)
      res.json({
        message: "登录成功",
        data: {
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 退出登录 (硬退出：清理 Cookie + 标记 Token 黑名单)
   */
  static async logout(req: Request, res: Response) {
    const token = req.cookies["Admin-Token"];

    if (token) {
      try {
        const decoded = JwtUtils.decode(token);
        if (decoded && decoded.exp) {
          // 1. 计算 Token 剩余寿命 (秒)
          const now = Math.floor(Date.now() / 1000);
          const remainingTime = decoded.exp - now;

          if (remainingTime > 0) {
            // 2. 将 Token 加入 Redis 黑名单 (优先使用 JTI)
            const blacklistKey = JwtUtils.getBlacklistKey(decoded.jti || token);
            await redis.setex(blacklistKey, remainingTime, "1");
            logger.info(
              `Token blacklisted for logout. JTI: ${decoded.jti || "N/A"}, TTL: ${remainingTime}s`,
            );
          }
        }
      } catch (err) {
        logger.error(err, "Failed to blacklist token during logout");
      }
    }

    // 3. 清理客户端 Cookie
    res.clearCookie("Admin-Token");
    res.json({ message: "退出成功" });
  }
}
