import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { toast } from "sonner";

/**
 * 后端统一响应包装结构
 * 对应后端 R.ok / R.fail 返回格式
 */
interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

/**
 * 从 Cookie 中提取指定名称的值
 * 用于读取 CSRF Token（XSRF-TOKEN），注入到请求 Header 中
 */
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

/**
 * 企业级 Axios 请求封装
 * 自动解包后端标准响应、注入 CSRF Token、统一错误处理
 */
class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // 请求拦截器：注入 CSRF Token
    this.instance.interceptors.request.use(
      (reqConfig) => {
        // 从 Cookie 读取 XSRF-TOKEN 并注入到 Header
        const csrfToken = getCookie("XSRF-TOKEN");
        if (csrfToken) {
          reqConfig.headers["x-xsrf-token"] = csrfToken;
        }
        return reqConfig;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器：解包标准 API 响应 { code, message, data, timestamp }
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const apiRes = response.data;

        // 业务层错误码处理（HTTP 200 但 code 非 200）
        if (apiRes.code !== 200 && apiRes.code !== 201) {
          toast.error("业务异常", {
            description: apiRes.message || "未知错误",
          });
          return Promise.reject(new Error(apiRes.message));
        }

        // 直接返回解包后的业务数据，调用方无需再 .data
        return apiRes.data as unknown as AxiosResponse;
      },
      (error) => {
        // logout 接口静默处理（退出时 Token 失效导致 401 是预期行为）
        const isLogoutRequest = error.config?.url?.includes("/auth/logout");
        if (isLogoutRequest) {
          return Promise.reject(error);
        }

        const status = error.response?.status;
        // 后端返回的业务消息（对齐 { code, message, data, timestamp } 格式）
        const serverMessage = error.response?.data?.message;

        // 根据 HTTP 状态码分级展示弹窗
        if (status && serverMessage) {
          switch (status) {
            case 400:
              // 参数校验失败、验证码错误等
              toast.warning("提交信息有误", { description: serverMessage });
              break;
            case 401:
              // 密码错误、Token 过期等
              toast.error("身份验证失败", { description: serverMessage });
              // 清除本地登录态并跳转（非登录页触发的 401）
              localStorage.removeItem("auth-storage");
              window.location.href = "/login";
              break;
            case 403:
              // 账号锁定、权限不足等
              toast.error("访问被拒绝", { description: serverMessage });
              break;
            case 404:
              toast.warning("资源不存在", { description: serverMessage });
              break;
            case 429:
              // 限流
              toast.warning("操作太频繁", { description: serverMessage });
              break;
            default:
              // 500 及其他服务端错误
              toast.error("服务器错误", {
                description: serverMessage || "请稍后重试",
              });
          }
        } else if (error.code === "ECONNABORTED") {
          // 请求超时
          toast.error("请求超时", { description: "服务器响应过慢，请稍后重试" });
        } else if (!error.response) {
          // 网络断开 / 服务端未启动
          toast.error("网络异常", { description: "无法连接到服务器，请检查网络" });
        } else {
          // 兜底
          toast.error("请求失败", {
            description: error.message || "未知错误",
          });
        }

        return Promise.reject(error);
      },
    );
  }

  public get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  public post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  public delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  public put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.put(url, data, config);
  }
}

const request = new Request({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  withCredentials: true, // 必须开启以支持 HttpOnly Cookie
});

export default request;
