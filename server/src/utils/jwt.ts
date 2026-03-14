import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import config from "../config/index.js";
import type { JwtPayload } from "../types/auth.types.js";

const { JWT_SECRET, JWT_EXPIRES_IN } = config.env;

/** Refresh Token 有效期：7 天 */
const REFRESH_TOKEN_EXPIRES_IN = "7d";

/**
 * JWT 工具类 (企业级加固版)
 * 支持 Access Token + Refresh Token 双令牌体系
 * 支持 JTI 唯一标识，配合 Redis 黑名单实现令牌主动撤销
 */
export class JwtUtils {
  /**
   * 生成 Access Token（短期令牌）
   * @param payload 载荷信息 (如 userId, username)
   */
  static signAccessToken(payload: {
    userId: string;
    username: string;
  }): string {
    const jti = uuidv4();
    return jwt.sign({ ...payload, jti, type: "access" }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * 生成 Refresh Token（长期令牌）
   * @param payload 载荷信息
   */
  static signRefreshToken(payload: {
    userId: string;
    username: string;
  }): string {
    const jti = uuidv4();
    return jwt.sign({ ...payload, jti, type: "refresh" }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * 验证令牌签名与有效期
   */
  static verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * 仅解码令牌（不验证签名，用于退出时读取过期信息）
   */
  static decode(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload | null;
  }

  /** 生成账号锁定 Redis Key */
  static getLockKey(identifier: string): string {
    return `auth:lock:${identifier}`;
  }

  /** 生成失败尝试计数 Redis Key */
  static getAttemptKey(identifier: string): string {
    return `auth:attempt:${identifier}`;
  }

  /** 生成 Token 黑名单 Redis Key（基于 JTI） */
  static getBlacklistKey(jti: string): string {
    return `auth:blacklist:${jti}`;
  }

  /** 生成 Refresh Token 存储 Redis Key */
  static getRefreshKey(userId: string, jti: string): string {
    return `auth:refresh:${userId}:${jti}`;
  }
}
