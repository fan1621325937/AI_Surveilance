import { type Request, type Response, type NextFunction } from "express";
import logger from "../utils/logger.js";

/**
 * 全局错误处理中间件
 * 捕获所有应用中未被处理的异常并利用 Pino 记录日志
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 使用 Pino 记录详细错误日志
  logger.error({
    msg: "Unhandled Error Occurred",
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_ERROR";

  res.status(status).json({
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  });
};
