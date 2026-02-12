import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AuthGuardProps {
    children: ReactNode;
}

/**
 * 路由守卫：校验登录状态
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        // 未登录时跳转登录页，并记录来源路径
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

/**
 * 游客守卫：已登录时禁止访问登录页
 */
export const GuestGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
