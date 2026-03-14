import { describe, it, expect, vi } from "vitest";

// Mock AppError
vi.mock("../../utils/app-error.js", () => ({
  AppError: {
    badRequest: (msg: string, code: string) => ({
      statusCode: 400,
      message: msg,
      code,
    }),
    forbidden: (msg: string, code: string) => ({
      statusCode: 403,
      message: msg,
      code,
    }),
  },
}));

// Mock Prisma
vi.mock("../../models/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock CryptoUtils
vi.mock("../../utils/crypto.js", () => ({
  CryptoUtils: {
    verify: vi.fn(),
  },
}));

import { AccountLoginStrategy } from "./account.strategy.js";
import { EmailLoginStrategy } from "./email.strategy.js";
import { CryptoUtils } from "../../utils/crypto.js";
import prisma from "../../models/prisma.js";

describe("AccountLoginStrategy - 账号登录策略", () => {
  const strategy = new AccountLoginStrategy();

  it("name 属性应为 account", () => {
    expect(strategy.name).toBe("account");
  });

  describe("validate", () => {
    it("应正确校验 username + password", () => {
      const result = strategy.validate({
        username: "admin",
        password: "123456",
      });

      expect(result.username).toBe("admin");
      expect(result.password).toBe("123456");
    });

    it("应支持 identifier 替代 username", () => {
      const result = strategy.validate({
        identifier: "admin",
        password: "123456",
      });

      expect(result.username).toBe("admin");
    });

    it("缺少用户名应抛出校验错误", () => {
      expect(() =>
        strategy.validate({ password: "123456" }),
      ).toThrow();
    });

    it("密码为空应抛出校验错误", () => {
      expect(() =>
        strategy.validate({ username: "admin", password: "" }),
      ).toThrow();
    });
  });

  describe("findUser", () => {
    it("应使用 username 查询数据库", async () => {
      const mockUser = { id: "1", username: "admin" };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await strategy.findUser({
        username: "admin",
        password: "test",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "admin" },
      });
      expect(result).toEqual(mockUser);
    });

    it("用户不存在应返回 null", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await strategy.findUser({
        username: "nonexistent",
        password: "test",
      });

      expect(result).toBeNull();
    });
  });

  describe("verify", () => {
    it("密码正确应返回 true", async () => {
      vi.mocked(CryptoUtils.verify).mockResolvedValue(true);

      const result = await strategy.verify(
        { password: "hashed_pw" } as any,
        { password: "plain_pw" },
      );

      expect(CryptoUtils.verify).toHaveBeenCalledWith("hashed_pw", "plain_pw");
      expect(result).toBe(true);
    });

    it("密码不正确应返回 false", async () => {
      vi.mocked(CryptoUtils.verify).mockResolvedValue(false);

      const result = await strategy.verify(
        { password: "hashed_pw" } as any,
        { password: "wrong_pw" },
      );

      expect(result).toBe(false);
    });

    it("密码为空应返回 false", async () => {
      const result = await strategy.verify(
        { password: "hashed_pw" } as any,
        { password: "" },
      );

      expect(result).toBe(false);
    });
  });
});

describe("EmailLoginStrategy - 邮箱登录策略", () => {
  const strategy = new EmailLoginStrategy();

  it("name 属性应为 email", () => {
    expect(strategy.name).toBe("email");
  });

  describe("validate", () => {
    it("应正确校验 email + password", () => {
      const result = strategy.validate({
        email: "test@example.com",
        password: "123456",
      });

      expect(result.email).toBe("test@example.com");
      expect(result.password).toBe("123456");
    });

    it("无效邮箱格式应抛出错误", () => {
      expect(() =>
        strategy.validate({
          email: "not-an-email",
          password: "123456",
        }),
      ).toThrow();
    });

    it("缺少邮箱应抛出校验错误", () => {
      expect(() =>
        strategy.validate({ password: "123456" }),
      ).toThrow();
    });
  });

  describe("findUser", () => {
    it("应使用 email 查询数据库", async () => {
      const mockUser = { id: "1", email: "test@example.com" };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await strategy.findUser({
        email: "test@example.com",
        password: "test",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
