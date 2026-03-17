import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../utils/redis.js";
import config from "../config/index.js";

/**
 * 登录接口专用分布式限流中间件
 * 采用 Redis 作为共享后端，支持集群部署
 *
 * 企业级改进：
 * 1. 双维度限流：IP 限流 + 账号名限流（防止分布式暴力破解）
 * 2. 使用 Redis Store 支持多实例部署
 */

/** IP 维度限流 (防止单 IP 扫描多账号) */
export const loginIpRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis 类型适配问题
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: "rl:login:ip:",
  }),

  // 时间窗口
  windowMs: config.auth.rate_limit.window_ms,

  // 每个 IP 在窗口内的最大请求数
  max: config.auth.rate_limit.max_attempts,

  // 错误响应
  message: {
    code: 429,
    message: "登录尝试太频繁，请在 15 分钟后再试",
    data: null,
    timestamp: Date.now(),
  },

  standardHeaders: true,
  legacyHeaders: false,
});

/** 账号维度限流 (防止分布式攻击同一账号) */
export const loginAccountRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis 类型适配问题
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: "rl:login:account:",
  }),

  windowMs: config.auth.rate_limit.window_ms,
  max: config.auth.rate_limit.max_attempts,

  // 使用请求体中的账号名作为限流标识（不使用 req.ip 避免 IPv6 兼容性问题）
  keyGenerator: (req) => {
    return (
      req.body?.username || req.body?.email || req.body?.identifier || "unknown"
    );
  },

  message: {
    code: 429,
    message: "该账号登录尝试过于频繁，请稍后再试",
    data: null,
    timestamp: Date.now(),
  },

  standardHeaders: true,
  legacyHeaders: false,
});
