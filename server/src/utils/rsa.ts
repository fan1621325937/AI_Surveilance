import crypto from "crypto";
import logger from "./logger.js";
import redis from "./redis.js";

/** Redis 中 RSA 密钥对的存储 Key */
const RSA_PUBLIC_KEY = "rsa:public_key";
const RSA_PRIVATE_KEY = "rsa:private_key";
/** 密钥对有效期：24 小时（秒） */
const RSA_KEY_TTL = 86400;

/**
 * RSA 加密工具类 (企业级版本)
 *
 * 改进点：
 * 1. 密钥对持久化到 Redis，多实例共享
 * 2. 重启不丢失，在 TTL 内复用同一密钥对
 * 3. 原子化初始化，防止并发重复生成
 */
export class RsaUtils {
  private static privateKey: string;
  private static publicKey: string;
  private static initPromise: Promise<void> | null = null;

  /**
   * 初始化密钥对（支持 Redis 持久化）
   * 使用 Promise 避免并发初始化的竞态条件
   */
  static async initKeys(): Promise<void> {
    // 防止并发重复初始化
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInitKeys();
    return this.initPromise;
  }

  private static async _doInitKeys(): Promise<void> {
    try {
      // 优先从 Redis 读取已有密钥对
      const [cachedPublic, cachedPrivate] = await Promise.all([
        redis.get(RSA_PUBLIC_KEY),
        redis.get(RSA_PRIVATE_KEY),
      ]);

      if (cachedPublic && cachedPrivate) {
        this.publicKey = cachedPublic;
        this.privateKey = cachedPrivate;
        logger.info("🔑 RSA Key pair loaded from Redis cache.");
        return;
      }

      // 生成新密钥对
      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      this.privateKey = privateKey;
      this.publicKey = publicKey;

      // 存储到 Redis（设置 TTL 自动过期刷新）
      await Promise.all([
        redis.setex(RSA_PUBLIC_KEY, RSA_KEY_TTL, publicKey),
        redis.setex(RSA_PRIVATE_KEY, RSA_KEY_TTL, privateKey),
      ]);

      logger.info("🔑 RSA Key pair generated and cached to Redis.");
    } catch (err) {
      logger.error(err, "❌ Failed to initialize RSA keys");
      // 降级：在内存中生成
      this._generateLocalKeys();
    }
  }

  /** 降级方案：仅在内存中生成密钥对（Redis 不可用时） */
  private static _generateLocalKeys(): void {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    logger.warn("⚠️ RSA keys generated in-memory only (Redis unavailable).");
  }

  /** 获取公钥（用于下发给前端） */
  static async getPublicKey(): Promise<string> {
    if (!this.publicKey) await this.initKeys();
    return this.publicKey;
  }

  /**
   * 使用私钥解密
   * @param encryptedData Base64 编码的密文
   */
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      if (!this.privateKey) await this.initKeys();

      const buffer = Buffer.from(encryptedData, "base64");
      const decrypted = crypto.privateDecrypt(
        {
          key: this.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        buffer,
      );

      return decrypted.toString("utf8");
    } catch (err) {
      logger.error(err, "❌ RSA decryption failed");
      throw { status: 400, message: "数据解析失败，请刷新页面重试" };
    }
  }
}
