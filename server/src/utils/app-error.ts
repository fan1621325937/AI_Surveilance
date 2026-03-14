/**
 * 标准化应用异常类
 * 替代直接 throw 普通对象，提供完整的错误堆栈与分类能力
 */
export class AppError extends Error {
  /** HTTP 状态码 */
  public readonly statusCode: number;
  /** 业务错误码（机器可读） */
  public readonly code: string;
  /** 是否为可预期的业务异常（区别于系统级 Bug） */
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: string = "UNKNOWN_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);

    // 确保 instanceof 正确工作（TS 继承内置类的注意事项）
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // 保留原始堆栈信息
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 常用工厂方法 - 快速创建特定类型的错误
   */
  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(400, message, code);
  }

  static unauthorized(message: string, code = "UNAUTHORIZED") {
    return new AppError(401, message, code);
  }

  static forbidden(message: string, code = "FORBIDDEN") {
    return new AppError(403, message, code);
  }

  static notFound(message: string, code = "NOT_FOUND") {
    return new AppError(404, message, code);
  }

  static tooManyRequests(message: string, code = "TOO_MANY_REQUESTS") {
    return new AppError(429, message, code);
  }

  static internal(message: string, code = "INTERNAL_ERROR") {
    return new AppError(500, message, code, false);
  }
}
