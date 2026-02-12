import { type Request, type Response, type NextFunction } from "express";
import { JwtUtils } from "../utils/jwt.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

/**
 * 身份鉴权中间件 (JWT + Redis 黑名单)
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. 从 Cookie 中获取 Token
    const token = req.cookies["Admin-Token"];

    if (!token) {
      return res
        .status(401)
        .json({ status: 401, message: "未登录或登录已过期" });
    }

    // 2. JWT 合法性校验 (首先验证签名与过期)
    const decoded = JwtUtils.verify(token);
    if (!decoded) {
      return res
        .status(401)
        .json({ status: 401, message: "登录令牌无效或已过期" });
    }

    // 3. 实时黑名单检查 (基于 JTI)
    // 如果 token 中包含 jti 且在黑名单中，说明该用户已主动退出
    if (decoded.jti) {
      const blacklistKey = JwtUtils.getBlacklistKey(decoded.jti);
      const isBlacklisted = await redis.get(blacklistKey);

      if (isBlacklisted) {
        logger.warn(`Security: Blocked revoked jti [${decoded.jti}]`);
        return res
          .status(401)
          .json({ status: 401, message: "登录已失效，请重新登录" });
      }
    }

    // 4. 注入用户信息到 Request 对象
    (req as any).user = decoded;
    next();
  } catch (error) {
    logger.error(error, "Auth Middleware Error");
    res.status(401).json({ status: 401, message: "鉴权失败" });
  }
};
