import { QueryClient } from "@tanstack/react-query";

/**
 * 全局 TanStack Query 客户端配置
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 失败重试次数
      refetchOnWindowFocus: false, // 窗口聚焦时不自动重新请求
      staleTime: 5 * 60 * 1000, // 数据 5 分钟内视为新鲜
    },
  },
});
