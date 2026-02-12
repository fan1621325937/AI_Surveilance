import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserInfo } from "../api/auth";

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (user: UserInfo) => void;
  clearAuth: () => void;
}

/**
 * 全局认证状态管理 (Zustand + 持久化)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage", // 存储在 localStorage 中的 key
    },
  ),
);
