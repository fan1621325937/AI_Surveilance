import request from "./request";

export interface UserInfo {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: UserInfo;
  };
}

export interface PublicKeyResponse {
  publicKey: string;
}

export interface CaptchaResponse {
  code: number;
  captchaId: string;
  img: string; // SVG string
}

/**
 * 身份认证相关 API
 */
export const authApi = {
  /**
   * 获取 RSA 公钥
   */
  getPublicKey: () => request.get<PublicKeyResponse>("/auth/public-key"),

  /**
   * 获取验证码
   */
  getCaptcha: () => request.get<CaptchaResponse>("/auth/captcha"),

  /**
   * 登录
   */
  login: (data: any) => request.post<LoginResponse>("/auth/login", data),

  /**
   * 登出
   */
  logout: () => request.post("/auth/logout"),
};
