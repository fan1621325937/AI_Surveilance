import { type Request, type Response, type NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * 请求 ID 中间件
 * 为每个请求注入唯一 RequestId，贯穿日志系统，用于分布式链路追踪
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 优先使用上游网关传递的 ID，否则生成新的
  const requestId =
    (req.headers["x-request-id"] as string) || uuidv4();

  // 注入到 Request 对象中，供后续中间件和业务使用
  (req as any).requestId = requestId;

  // 写入响应头，方便客户端和运维排查
  res.setHeader("X-Request-Id", requestId);

  next();
};
