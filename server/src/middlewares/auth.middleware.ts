import { type Request, type Response, type NextFunction } from "express";
import { JwtUtils } from "../utils/jwt.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";
import { R } from "../utils/response.js";

/**
 * 身份鉴权中间件 (JWT + Redis 黑名单)
 *
 * 校验流程：
 * 1. 从 HttpOnly Cookie 提取 Token
 * 2. 验证 JWT 签名与有效期
 * 3. 基于 JTI 检查 Redis 黑名单
 * 4. 注入用户信息到 Request 对象
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies["Admin-Token"];

    if (!token) {
      return R.fail(res, 401, "未登录或登录已过期");
    }

    // JWT 合法性校验
    const decoded = JwtUtils.verify(token);
    if (!decoded) {
      return R.fail(res, 401, "登录令牌无效或已过期");
    }

    // 确保是 Access Token（非 Refresh Token）
    if (decoded.type !== "access") {
      return R.fail(res, 401, "令牌类型无效");
    }

    // 实时黑名单检查（基于 JTI）
    if (decoded.jti) {
      const blacklistKey = JwtUtils.getBlacklistKey(decoded.jti);
      const isBlacklisted = await redis.get(blacklistKey);

      if (isBlacklisted) {
        logger.warn(`Security: Blocked revoked jti [${decoded.jti}]`);
        return R.fail(res, 401, "登录已失效，请重新登录");
      }
    }

    // 注入用户信息
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.error(error, "Auth Middleware Error");
    R.fail(res, 401, "鉴权失败");
  }
};
