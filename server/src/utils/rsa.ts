import crypto from "crypto";
import logger from "./logger.js";

/**
 * RSA 加密解析工具类
 * 基于 Node.js 原生 crypto 模块实现
 */
export class RsaUtils {
  private static privateKey: string; // 私钥服务端用与解密
  private static publicKey: string; // 公钥给前端用与加密

  /**
   * 初始化/获取 RSA 密钥对
   * 在系统启动时生成，避免频繁重算
   */
  static initKeys() {
    if (this.privateKey) return;

    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048, // 指定密钥长度
        publicKeyEncoding: {
          type: "spki", // spki: SubjectPublicKeyInfo
          format: "pem", // pem: Base64 编码
        },
        privateKeyEncoding: {
          type: "pkcs8", // pkcs8: PrivateKeyInfo
          format: "pem", // pem: Base64 编码
        },
      });

      this.privateKey = privateKey;
      this.publicKey = publicKey;
      logger.info("🔑 RSA Key pair generated successfully.");
    } catch (err) {
      logger.error(err, "❌ Failed to generate RSA keys");
      throw new Error("RSA_INIT_FAILED");
    }
  }

  /**
   * 获取公钥 (用于下发给前端)
   */
  static getPublicKey(): string {
    if (!this.publicKey) this.initKeys();
    return this.publicKey;
  }

  /**
   * 使用私钥解密
   * @param encryptedData Base64 编码的密文
   */
  static decrypt(encryptedData: string): string {
    try {
      if (!this.privateKey) this.initKeys();

      const buffer = Buffer.from(encryptedData, "base64"); // Base64 解码
      const decrypted = crypto.privateDecrypt(
        {
          key: this.privateKey, // 私钥
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // 指定填充方式
          oaepHash: "sha256", // 指定 OAEP 填充的哈希算法
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

// 预初始化
RsaUtils.initKeys();
// rsa常用api
// crypto.generateKeyPairSync(type, options) //生成密钥对
// crypto.privateDecrypt(privateKey, buffer) //私钥解密
// crypto.publicEncrypt(publicKey, buffer) //公钥加密
