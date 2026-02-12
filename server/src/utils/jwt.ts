import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import config from "../config/index.js";

const { JWT_SECRET, JWT_EXPIRES_IN } = config.env;

/**
 * JWT 工具类 (金融级加固版)
 * 用于生成与验证身份令牌，支持 JTI 唯一标识
 */
export class JwtUtils {
  /**
   * 生成令牌
   * @param payload 载荷信息 (如 userId, username)
   */
  static sign(payload: object): string {
    const jti = uuidv4(); // 生成唯一标识
    return jwt.sign({ ...payload, jti }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });
  }

  /**
   * 验证令牌
   */
  static verify(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  /**
   * 解码令牌
   */
  static decode(token: string): any {
    return jwt.decode(token);
  }

  /**
   * 获取账号锁定 Key
   */
  static getLockKey(identifier: string): string {
    return `auth:lock:${identifier}`;
  }

  /**
   * 获取账号失败尝试 Key (Redis)
   */
  static getAttemptKey(identifier: string): string {
    return `auth:attempt:${identifier}`;
  }

  /**
   * 生成 Redis 黑名单 Key (基于 JTI)
   */
  static getBlacklistKey(jti: string): string {
    return `auth:blacklist:${jti}`;
  }
}
// jwt常用api
// jwt.sign(payload, secretOrPrivateKey, [options, callback]) //生成token
// jwt.verify(token, secretOrPublicKey, [options, callback]) //验证token
// jwt.decode(token, [options]) //解析token
