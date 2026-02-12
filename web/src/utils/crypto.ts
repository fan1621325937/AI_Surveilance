/**
 * RSA 加密工具类 (Web Crypto API 版本)
 * 采用更安全的 RSA-OAEP 填充方式，适配现代 Node.js 后端
 */
export class CryptoUtils {
  /**
   * 将 PEM 格式公钥转换为 CryptoKey
   */
  private static async importPublicKey(pem: string): Promise<CryptoKey> {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\s+/g, "");

    const binaryDerString = window.atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return window.crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"],
    );
  }

  /**
   * 使用公钥加密字符串 (RSA-OAEP)
   * @param text 待加密文本
   * @param publicKeyPem RSA 公钥 (PEM 格式)
   */
  static async encrypt(text: string, publicKeyPem: string): Promise<string> {
    try {
      const cryptoKey = await this.importPublicKey(publicKeyPem);
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        cryptoKey,
        data,
      );

      // 将 ArrayBuffer 转换为 Base64
      return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("加密失败");
    }
  }

  /**
   * 格式化公钥
   */
  static formatPublicKey(key: string): string {
    if (key.includes("BEGIN PUBLIC KEY")) return key;
    return `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
  }
}
