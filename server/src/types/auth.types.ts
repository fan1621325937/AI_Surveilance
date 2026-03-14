/**
 * 认证相关的严格类型定义
 * 替代 Record<string, any>，实现完整类型安全
 */

/** 支持的登录方式 */
export type LoginType = "account" | "email";

/** 登录请求参数（从 Controller 透传到 Service） */
export interface LoginParams {
  /** 登录方式 */
  loginType: LoginType;
  /** 用户名（账号登录时使用） */
  username?: string;
  /** 邮箱（邮箱登录时使用） */
  email?: string;
  /** 通用标识符（兼容前端不同字段名） */
  identifier?: string;
  /** RSA 加密后的密码 */
  password: string;
  /** 验证码 UUID */
  captchaId?: string;
  /** 验证码文本 */
  captchaCode?: string;
  /** 客户端 IP */
  clientIp: string;
  /** 客户端 User-Agent */
  userAgent: string;
}

/** 登录成功返回的用户摘要信息 */
export interface LoginUserInfo {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

/** 登录 Service 返回结果 */
export interface LoginResult {
  /** Access Token */
  accessToken: string;
  /** Refresh Token */
  refreshToken: string;
  /** 用户信息 */
  user: LoginUserInfo;
}

/** JWT Payload 载荷 */
export interface JwtPayload {
  userId: string;
  username: string;
  /** JWT 唯一标识 */
  jti: string;
  /** 签发时间 */
  iat: number;
  /** 过期时间 */
  exp: number;
  /** Token 类型 */
  type: "access" | "refresh";
}

/** 经过策略 validate 后的账号登录数据 */
export interface AccountLoginData {
  username: string;
  password: string;
}

/** 经过策略 validate 后的邮箱登录数据 */
export interface EmailLoginData {
  email: string;
  password: string;
}
