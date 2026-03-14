import { type Request, type Response, type NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../utils/app-error.js";

/**
 * CSRF 防护中间件 (Double Submit Cookie 模式)
 *
 * 实现原理：
 * 1. 服务端在响应中设置一个随机的 CSRF Cookie
 * 2. 前端从 Cookie 中读取该值，并在请求 Header 中携带
 * 3. 服务端比对 Cookie 中的值与 Header 中的值是否一致
 * 4. 跨站请求无法读取目标域的 Cookie，因此伪造请求无法获取正确的 CSRF Token
 */

const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "x-xsrf-token";

/** 需要 CSRF 保护的 HTTP 方法 */
const PROTECTED_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

/** 不需要 CSRF 保护的白名单路径（如登录本身） */
const WHITELIST_PATHS = ["/auth/login", "/auth/public-key", "/auth/captcha"];

/**
 * CSRF Token 下发中间件（在每个请求中刷新 Token）
 */
export const csrfTokenProvider = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 为每个响应生成/刷新 CSRF Token
  const token = uuidv4();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // 前端必须能读取此 Cookie
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  next();
};

/**
 * CSRF 校验中间件（验证请求中的 Token 是否匹配）
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 仅对修改型请求进行校验
  if (!PROTECTED_METHODS.has(req.method)) {
    return next();
  }

  // 白名单路径跳过
  if (WHITELIST_PATHS.some((path) => req.path.startsWith(path))) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw AppError.forbidden("CSRF Token 校验失败，请刷新页面重试", "CSRF_VALIDATION_FAILED");
  }

  next();
};
