import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { toast } from "sonner";

/**
 * 企业级 Axios 请求封装
 */
class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 后端使用 HttpOnly Cookie，前端通常不需要手动注入 Token
        // 如果有其他自定义 Header，可以在这里注入
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data } = response;
        // 预处理业务逻辑，例如处理后端统一返回包
        return data;
      },
      (error) => {
        const message =
          error.response?.data?.error?.message ||
          error.message ||
          "网络请求失败";

        // 统一错误提示
        toast.error("请求错误", {
          description: message,
        });

        if (error.response?.status === 401) {
          // 处理登录过期，例如清空用户信息并跳转登录页
          window.location.href = "/login";
        }

        return Promise.reject(error);
      },
    );
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  public post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  public put<T = any>(
    url: string,
    data?: any,
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
