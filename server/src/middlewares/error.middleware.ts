import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
import logger from "../utils/logger.js";

/**
 * 全局错误处理中间件
 * 统一捕获所有异常，区分业务异常和系统异常
 * 使用 Pino 记录结构化日志
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // 获取请求 ID 用于链路追踪
  const requestId = (req as any).requestId || "N/A";

  // 判断是否为业务异常（AppError 实例，且标记为可预期）
  if (err instanceof AppError && err.isOperational) {
    // 业务异常：仅记录 warn 级别
    logger.warn({
      msg: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      data: null,
      timestamp: Date.now(),
    });
  }

  // 系统异常 / 未知异常：记录 error 级别 + 完整堆栈
  logger.error({
    msg: "Unhandled Error Occurred",
    error: err.message,
    stack: err.stack,
    requestId,
    path: req.path,
    method: req.method,
  });

  // 对外屏蔽内部细节，仅返回通用错误信息
  const statusCode = (err as any).statusCode || (err as any).status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "服务器内部错误，请稍后重试"
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    code: statusCode,
    message,
    data: null,
    timestamp: Date.now(),
  });
};
