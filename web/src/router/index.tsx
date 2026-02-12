import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { AuthGuard, GuestGuard } from './guard';
import { lazy, Suspense } from 'react';

// 页面懒加载
const LoginPage = lazy(() => import('../pages/Login'));
const DashboardPage = lazy(() => import('../pages/Dashboard'));

/**
 * 路由配置系统
 */
export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <AuthGuard>
                <MainLayout />
            </AuthGuard>
        ),
        children: [
            {
                index: true,
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <DashboardPage />
                    </Suspense>
                ),
            },
            {
                path: 'settings',
                element: (
                    <Suspense fallback={<div>Loading...</div>}>
                        <div>系统设置页面 (待开发)</div>
                    </Suspense>
                ),
            },
        ],
    },
    {
        path: '/login',
        element: (
            <GuestGuard>
                <Suspense fallback={<div>Loading...</div>}>
                    <LoginPage />
                </Suspense>
            </GuestGuard>
        ),
    },
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
]);
