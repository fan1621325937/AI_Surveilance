import { describe, it, expect } from "vitest";
import { AppError } from "./app-error.js";

describe("AppError - 标准错误类", () => {
  it("应该正确创建业务异常实例", () => {
    const error = new AppError(400, "参数错误", "BAD_REQUEST");

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("参数错误");
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.isOperational).toBe(true);
    expect(error.stack).toBeDefined();
  });

  it("应该正确标记系统异常为非可预期的", () => {
    const error = AppError.internal("系统崩溃");

    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false); // 系统异常不可预期
    expect(error.code).toBe("INTERNAL_ERROR");
  });

  it("工厂方法应生成正确的状态码", () => {
    expect(AppError.badRequest("错误").statusCode).toBe(400);
    expect(AppError.unauthorized("未授权").statusCode).toBe(401);
    expect(AppError.forbidden("禁止").statusCode).toBe(403);
    expect(AppError.notFound("未找到").statusCode).toBe(404);
    expect(AppError.tooManyRequests("太频繁").statusCode).toBe(429);
    expect(AppError.internal("内部错误").statusCode).toBe(500);
  });

  it("工厂方法应支持自定义错误码", () => {
    const error = AppError.forbidden("账号被锁定", "ACCOUNT_LOCKED");
    expect(error.code).toBe("ACCOUNT_LOCKED");
  });

  it("默认错误码应为 UNKNOWN_ERROR", () => {
    const error = new AppError(500, "未知错误");
    expect(error.code).toBe("UNKNOWN_ERROR");
  });
});
