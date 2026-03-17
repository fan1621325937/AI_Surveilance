import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { LogOut, LayoutDashboard, Settings, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * 企业级管理后台主布局
 */
export default function MainLayout() {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleLogout = async () => {
        // 先清除本地状态并跳转（确保无论 API 是否成功都能退出）
        clearAuth();
        navigate("/login", { replace: true });

        // 后台异步通知后端撤销 Token（Best-effort，不阻塞退出流程）
        try {
            await authApi.logout();
        } catch {
            // 静默失败：Token 过期后后端会自动失效
        }
    };

    const navItems = [
        { label: "仪表盘", path: "/", icon: LayoutDashboard },
        { label: "系统设置", path: "/settings", icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* 侧边栏 */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
                <div className="p-6 text-xl font-bold border-b border-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <LayoutDashboard size={18} className="text-white" />
                    </div>
                    Ai Surveillance
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                pathname === item.path
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "hover:bg-slate-800 text-slate-400 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "transition-colors",
                                pathname === item.path ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <User size={20} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-white">{user?.nickname || user?.username || "Admin"}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">管理员</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">退出登录</span>
                    </Button>
                </div>
            </aside>

            {/* 主区域 */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                        {navItems.find(item => item.path === pathname)?.label || "管理控制台"}
                    </h2>
                    <div className="flex items-center gap-4">
                        {/* 可以在这里添加通知、头像等 */}
                    </div>
                </header>
                <div className="flex-1 overflow-auto bg-slate-50/50 custom-scrollbar">
                    <div className="p-8 max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
