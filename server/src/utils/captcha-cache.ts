import redis from "./redis.js";

/**
 * 验证码缓存管理 (Redis版)
 * 用于临时存储验证码答案与 UUID 的对应关系
 * 设置过期时间为 5 分钟 (300秒)
 */
export class CaptchaUtils {
  private static PREFIX = "captcha:"; //前缀

  /**
   * 存储验证码答案
   * @param id 客户端生成的或服务端下发的唯一标识 (key)
   * @param code 验证码文本
   */
  static async set(id: string, code: string): Promise<void> {
    const key = `${this.PREFIX}${id}`;
    // 存储为小写，并设置 300 秒过期
    await redis.set(key, code.toLowerCase(), "EX", 300);
  }

  /**
   * 校验验证码
   * @param id 唯一标识
   * @param input 用户输入的验证码
   */
  static async verify(id: string, input: string): Promise<boolean> {
    const key = `${this.PREFIX}${id}`;
    const savedCode = await redis.get(key);

    if (!savedCode) return false;

    // 校验成功后立即删除，防止重放攻击 (原子化逻辑建议)
    if (savedCode === input.toLowerCase()) {
      await redis.del(key);
      return true;
    }

    return false;
  }
}

// redis常用api
// redis.set(key, value, [options]) //设置key-value
// redis.get(key) //获取key-value
// redis.del(key) //删除key-value
// redis.hset(key, field, value) //设置hash
// redis.hget(key, field) //获取hash
// redis.hgetall(key) //获取hash所有字段
// redis.hdel(key, field) //删除hash字段
