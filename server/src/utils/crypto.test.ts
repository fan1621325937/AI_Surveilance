import { describe, it, expect } from "vitest";
import { CryptoUtils } from "./crypto.js";

describe("CryptoUtils - 密码加密工具类（Argon2）", () => {
  const testPassword = "MySecurePassword123!";

  it("hash 应生成非明文的哈希值", async () => {
    const hash = await CryptoUtils.hash(testPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(testPassword);
    expect(hash.startsWith("$argon2")).toBe(true); // Argon2 哈希前缀
  });

  it("verify 应能正确验证匹配的密码", async () => {
    const hash = await CryptoUtils.hash(testPassword);
    const result = await CryptoUtils.verify(hash, testPassword);

    expect(result).toBe(true);
  });

  it("verify 应拒绝不匹配的密码", async () => {
    const hash = await CryptoUtils.hash(testPassword);
    const result = await CryptoUtils.verify(hash, "WrongPassword");

    expect(result).toBe(false);
  });

  it("同一密码每次哈希结果应不同（随机盐）", async () => {
    const hash1 = await CryptoUtils.hash(testPassword);
    const hash2 = await CryptoUtils.hash(testPassword);

    expect(hash1).not.toBe(hash2);
  });

  it("verify 对无效哈希值应返回 false（不抛异常）", async () => {
    const result = await CryptoUtils.verify("invalid_hash", testPassword);
    expect(result).toBe(false);
  });
});
