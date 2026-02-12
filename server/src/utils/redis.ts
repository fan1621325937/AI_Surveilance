import { Redis, type RedisOptions } from "ioredis";
import config from "../config/index.js";
import logger from "./logger.js";

/**
 * 构建 Redis 配置项
 * 适配 TS 严格模式 (exactOptionalPropertyTypes: true)
 */
const redisOptions: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000); // 自动重连策略
    return delay;
  },
};

// 仅当密码存在时注入，避免 undefined 导致的严格模式校验错误
if (config.redis.password) {
  redisOptions.password = config.redis.password;
}

/**
 * 全局 Redis 实例
 */
const redis = new Redis(redisOptions);

redis.on("connect", () => {
  logger.info("📡 Redis connected successfully.");
});

redis.on("error", (err: Error) => {
  logger.error(err, "❌ Redis connection error");
});

export default redis;
// redis常用api
// redis.set(key, value, [options]) //设置key-value
// redis.get(key) //获取key-value
// redis.del(key) //删除key-value
// redis.hset(key, field, value) //设置hash
// redis.hget(key, field) //获取hash
// redis.hgetall(key) //获取hash所有字段
// redis.hdel(key, field) //删除hash字段
