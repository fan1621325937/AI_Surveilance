import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../utils/redis.js";
import config from "../config/index.js";

/**
 * 登录接口专用分布式限流中间件
 * 采用 Redis 作为共享后端，支持集群部署
 * rateLimit作用是限制同一IP在一定时间内的请求次数 redis作为共享后端
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
  // 覆盖默认的 IP 限流，改为基于请求体中的账号名限流
  // keyGenerator: (req) => {
  //   // 假设前端表单提交的账号字段叫 username
  //   return req.body.username || req.ip;
  // },

  // 默认使用 request.ip 作为限流标识 (配合 app.set('trust proxy', 1) 使用)
});
