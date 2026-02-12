import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../utils/redis.js";
import config from "../config/index.js";

/**
 * 登录接口专用分布式限流中间件
 * 采用 Redis 作为共享后端，支持集群部署
 */
export const loginRateLimiter = rateLimit({
  // 使用 Redis 存储
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis 类型适配问题
    sendCommand: (...args: string[]) => redis.call(...args),
  }),

  // 时间窗口 (毫秒)
  windowMs: config.auth.rate_limit.window_ms,

  // 每个 IP 在窗口内的最大请求数
  max: config.auth.rate_limit.max_attempts,

  // 错误响应内容
  message: {
    code: 429,
    message: "登录尝试太频繁，请在 15 分钟后再试",
  },

  // 启用标准 HTTP 响应头
  standardHeaders: true,
  legacyHeaders: false,

  // 默认使用 request.ip 作为限流标识 (配合 app.set('trust proxy', 1) 使用)
});
