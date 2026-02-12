import argon2 from "argon2";

/**
 * 现代加密工具类 (Argon2)
 * 用于处理用户密码的安全存储与验证
 */
export class CryptoUtils {
  /**
   * 哈希加密密码
   * @param password 明文密码
   */
  static async hash(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  /**
   * 验证密码是否正确
   * @param hash 数据库中的哈希值
   * @param password 用户输入的明文密码
   */
  static async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (err) {
      return false;
    }
  }
}

// argon2常用api
// argon2.hash(password) //哈希加密密码
// argon2.verify(hash, password) //验证密码是否正确
// argon2.hashRaw(password) //哈希加密密码
// argon2.verifyRaw(hash, password) //验证密码是否正确
