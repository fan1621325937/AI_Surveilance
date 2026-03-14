import { type Request, type Response, type NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { RsaUtils } from "../utils/rsa.js";
import { JwtUtils } from "../utils/jwt.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";
import { R } from "../utils/response.js";
import { AppError } from "../utils/app-error.js";
import type { LoginParams } from "../types/auth.types.js";

/**
 * 身份认证控制器
 * 职责：处理 HTTP 请求/响应，不包含业务逻辑
 */
export class AuthController {
  /**
   * 获取 RSA 公钥（异步版本，支持 Redis 持久化）
   */
  static async getPublicKey(req: Request, res: Response, next: NextFunction) {
    try {
      const publicKey = await RsaUtils.getPublicKey();
      R.ok(res, { publicKey });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 处理登录请求 (适配 RSA 解密与双 Token 体系)
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // 构建类型安全的登录参数
      const loginParams: LoginParams = {
        ...req.body,
        loginType: req.body.loginType || "account",
        clientIp: req.ip || req.socket.remoteAddress || "0.0.0.0",
        userAgent: req.headers["user-agent"] || "Unknown",
      };

      // 执行登录逻辑
      const result = await AuthService.login(loginParams);

      // 将 Access Token 写入 HttpOnly Cookie（防 XSS）
      res.cookie("Admin-Token", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 小时
      });

      // 将 Refresh Token 写入独立的 HttpOnly Cookie
      res.cookie("Refresh-Token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/auth/refresh", // 仅在 Refresh 路径上发送
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
      });

      // 返回用户信息（Token 不暴露在响应体中）
      R.ok(res, { user: result.user }, "登录成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 刷新 Token（用 Refresh Token 换取新的 Access Token）
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies["Refresh-Token"];

      if (!refreshToken) {
        throw AppError.unauthorized("Refresh Token 不存在，请重新登录");
      }

      const decoded = JwtUtils.verify(refreshToken);
      if (!decoded || decoded.type !== "refresh") {
        throw AppError.unauthorized("Refresh Token 无效或已过期");
      }

      // 检查 Refresh Token 是否在 Redis 中仍有效
      const refreshKey = JwtUtils.getRefreshKey(decoded.userId, decoded.jti);
      const isValid = await redis.get(refreshKey);
      if (!isValid) {
        throw AppError.unauthorized("Refresh Token 已被撤销");
      }

      // 签发新的 Access Token
      const newAccessToken = JwtUtils.signAccessToken({
        userId: decoded.userId,
        username: decoded.username,
      });

      // 写入新 Cookie
      res.cookie("Admin-Token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      R.ok(res, null, "Token 刷新成功");
    } catch (err) {
      next(err);
    }
  }

  /**
   * 退出登录 (硬退出：清理 Cookie + 标记 Token 黑名单 + 撤销 Refresh Token)
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies["Admin-Token"];
      const refreshToken = req.cookies["Refresh-Token"];

      // 将 Access Token 加入黑名单
      if (accessToken) {
        const decoded = JwtUtils.decode(accessToken);
        if (decoded?.exp && decoded?.jti) {
          const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTime > 0) {
            const blacklistKey = JwtUtils.getBlacklistKey(decoded.jti);
            await redis.setex(blacklistKey, remainingTime, "1");
            logger.info(
              `Token blacklisted for logout. JTI: ${decoded.jti}, TTL: ${remainingTime}s`,
            );
          }
        }
      }

      // 撤销 Refresh Token
      if (refreshToken) {
        const decoded = JwtUtils.decode(refreshToken);
        if (decoded?.userId && decoded?.jti) {
          const refreshKey = JwtUtils.getRefreshKey(
            decoded.userId,
            decoded.jti,
          );
          await redis.del(refreshKey);
          logger.info(`Refresh token revoked for user: ${decoded.userId}`);
        }
      }

      // 清理客户端 Cookie
      res.clearCookie("Admin-Token");
      res.clearCookie("Refresh-Token", { path: "/auth/refresh" });

      R.ok(res, null, "退出成功");
    } catch (err) {
      logger.error(err, "Logout error");
      // 即使黑名单操作失败，也应该清除 Cookie
      res.clearCookie("Admin-Token");
      res.clearCookie("Refresh-Token", { path: "/auth/refresh" });
      R.ok(res, null, "退出成功");
    }
  }
}
