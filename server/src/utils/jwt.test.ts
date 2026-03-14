import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock 所有 JWT 用到的依赖
vi.mock("uuid", () => ({
  v4: () => "test-uuid-1234",
}));

vi.mock("../config/index.js", () => ({
  default: {
    env: {
      JWT_SECRET: "test_jwt_secret_key_for_unit_testing",
      JWT_EXPIRES_IN: "1h",
    },
  },
}));

// 在 mock 设置后再导入模块
import { JwtUtils } from "./jwt.js";

describe("JwtUtils - JWT 工具类", () => {
  it("signAccessToken 应生成有效的 Access Token", () => {
    const token = JwtUtils.signAccessToken({
      userId: "user-1",
      username: "admin",
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT 三段式结构
  });

  it("signRefreshToken 应生成有效的 Refresh Token", () => {
    const token = JwtUtils.signRefreshToken({
      userId: "user-1",
      username: "admin",
    });

    expect(token).toBeDefined();
    expect(token.split(".")).toHaveLength(3);
  });

  it("verify 应能正确验证 Access Token", () => {
    const token = JwtUtils.signAccessToken({
      userId: "user-1",
      username: "admin",
    });

    const decoded = JwtUtils.verify(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("user-1");
    expect(decoded!.username).toBe("admin");
    expect(decoded!.type).toBe("access");
    expect(decoded!.jti).toBe("test-uuid-1234");
  });

  it("verify 应能正确验证 Refresh Token", () => {
    const token = JwtUtils.signRefreshToken({
      userId: "user-2",
      username: "editor",
    });

    const decoded = JwtUtils.verify(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.type).toBe("refresh");
  });

  it("verify 对无效 Token 应返回 null", () => {
    const result = JwtUtils.verify("invalid.token.here");
    expect(result).toBeNull();
  });

  it("decode 应能解码但不验证 Token", () => {
    const token = JwtUtils.signAccessToken({
      userId: "user-1",
      username: "admin",
    });

    const decoded = JwtUtils.decode(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("user-1");
  });

  it("Redis Key 生成方法应返回正确格式", () => {
    expect(JwtUtils.getLockKey("admin")).toBe("auth:lock:admin");
    expect(JwtUtils.getAttemptKey("admin")).toBe("auth:attempt:admin");
    expect(JwtUtils.getBlacklistKey("jti-123")).toBe("auth:blacklist:jti-123");
    expect(JwtUtils.getRefreshKey("user-1", "jti-456")).toBe(
      "auth:refresh:user-1:jti-456",
    );
  });
});
