import { describe, it, expect } from "vitest";
import { R } from "./response.js";

/**
 * 创建模拟 Response 对象
 */
function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe("R - 统一响应工具类", () => {
  it("R.ok 应返回 200 状态码和正确结构", () => {
    const res = createMockRes();
    R.ok(res, { name: "test" });

    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.message).toBe("操作成功");
    expect(res.body.data).toEqual({ name: "test" });
    expect(res.body.timestamp).toBeDefined();
  });

  it("R.ok 应支持自定义消息", () => {
    const res = createMockRes();
    R.ok(res, null, "登录成功");

    expect(res.body.message).toBe("登录成功");
    expect(res.body.data).toBeNull();
  });

  it("R.created 应返回 201 状态码", () => {
    const res = createMockRes();
    R.created(res, { id: "123" });

    expect(res.statusCode).toBe(201);
    expect(res.body.code).toBe(201);
    expect(res.body.message).toBe("创建成功");
    expect(res.body.data).toEqual({ id: "123" });
  });

  it("R.fail 应返回指定的错误状态码", () => {
    const res = createMockRes();
    R.fail(res, 403, "禁止访问");

    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe(403);
    expect(res.body.message).toBe("禁止访问");
    expect(res.body.data).toBeNull();
    expect(res.body.timestamp).toBeDefined();
  });
});
