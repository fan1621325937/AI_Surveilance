import { type Response } from "express";

/**
 * 统一响应工具类
 * 确保所有 API 返回一致的数据结构
 */
export class R {
  /**
   * 成功响应
   */
  static ok<T>(res: Response, data: T, message = "操作成功") {
    return res.status(200).json({
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 创建成功
   */
  static created<T>(res: Response, data: T, message = "创建成功") {
    return res.status(201).json({
      code: 201,
      message,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 失败响应
   */
  static fail(res: Response, code: number, message: string) {
    return res.status(code).json({
      code,
      message,
      data: null,
      timestamp: Date.now(),
    });
  }
}
