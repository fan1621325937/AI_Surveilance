import request from "./request";

/**
 * 用户信息（对齐后端 LoginUserInfo 结构）
 */
export interface UserInfo {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

/**
 * 登录请求参数（替代 any，类型安全）
 */
export interface LoginParams {
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
  loginType?: "account" | "email";
}

/**
 * 登录成功后拦截器解包后的业务数据
 */
export interface LoginData {
  user: UserInfo;
}

/**
 * 获取公钥接口响应
 */
export interface PublicKeyData {
  publicKey: string;
}

/**
 * 获取验证码接口响应
 */
export interface CaptchaData {
  captchaId: string;
  img: string;
}

/**
 * 身份认证相关 API
 * 所有返回类型均为拦截器解包后的业务数据层
 */
export const authApi = {
  /**
   * 获取 RSA 公钥
   */
  getPublicKey: () => request.get<PublicKeyData>("/auth/public-key"),

  /**
   * 获取验证码
   */
  getCaptcha: () => request.get<CaptchaData>("/auth/captcha"),

  /**
   * 登录
   */
  login: (data: LoginParams) => request.post<LoginData>("/auth/login", data),

  /**
   * 登出
   */
  logout: () => request.post("/auth/logout"),
};
