import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

import { authApi } from '@/api/auth';
import { CryptoUtils } from '@/utils/crypto';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

/**
 * 登录表单校验 Schema
 */
const loginSchema = z.object({
    username: z.string().min(1, '请输入用户名'),
    password: z.string().min(1, '请输入密码'),
    captchaCode: z.string().min(1, '请输入验证码'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [loading, setLoading] = useState(false);
    const [captcha, setCaptcha] = useState<{ id: string; img: string } | null>(null);

    // 获取验证码
    const fetchCaptcha = async () => {
        try {
            const res = await authApi.getCaptcha();

            setCaptcha({ id: res.captchaId, img: res.img });
        } catch (error) {
            console.error('Failed to fetch captcha', error);
            toast.error('获取验证码失败');
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
            captchaCode: '',
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setLoading(true);
        try {
            // 1. 获取公钥
            const { publicKey } = await authApi.getPublicKey();

            // 2. RSA 加密密码
            const formattedKey = CryptoUtils.formatPublicKey(publicKey);
            const encryptedPassword = await CryptoUtils.encrypt(values.password, formattedKey);

            if (!encryptedPassword) {
                throw new Error('加密组件初始化失败');
            }

            // 3. 提交登录
            const res = await authApi.login({
                username: values.username,
                password: encryptedPassword,
                captchaId: captcha?.id,
                captchaCode: values.captchaCode,
            });

            // 4. 更新状态并跳转
            setAuth(res.data.user);
            toast.success('登录成功', { description: '欢迎进入 Ai Surveillance 系统' });
            navigate('/', { replace: true });
        } catch (error) {
            fetchCaptcha();
            form.setValue('captchaCode', '');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-3">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-primary/10 rounded-3xl shadow-inner">
                            <ShieldCheck className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                        Ai Surveillance
                    </h1>
                    <p className="text-slate-500 font-medium">企业级全场景智能监控管理平台</p>
                </div>

                <Card className="border-none shadow-2xl shadow-slate-300/60 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-10 bg-white">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }: { field: any }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-slate-700 font-semibold ml-1">用户名</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="请输入用户名"
                                                    className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="ml-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }: { field: any }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-slate-700 font-semibold ml-1">密码</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="请输入密码"
                                                    className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="ml-1" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="captchaCode"
                                    render={({ field }: { field: any }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-slate-700 font-semibold ml-1">验证码</FormLabel>
                                            <div className="flex gap-3">
                                                <FormControl>
                                                    <Input
                                                        className="h-12 flex-1 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all font-mono"
                                                        placeholder="验证码"
                                                        autoComplete="off"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <div
                                                    className="h-12 w-32 bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all flex items-center justify-center border border-slate-200"
                                                    onClick={fetchCaptcha}
                                                    title="点击刷新验证码"
                                                    dangerouslySetInnerHTML={{ __html: captcha?.img || '' }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={fetchCaptcha}
                                                    className="h-12 w-12 rounded-xl shrink-0"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <FormMessage className="ml-1" />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-all mt-4"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            正在验证...
                                        </>
                                    ) : (
                                        "安全访问控制台"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
