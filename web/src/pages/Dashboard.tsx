import {
    Video,
    AlertTriangle,
    HardDrive,
    TrendingUp,
    Activity,
    ChevronRight,
    Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const stats = [
        {
            title: "在线摄像头",
            value: "24",
            trend: "+12%",
            status: "positive",
            icon: Video,
            color: "blue",
        },
        {
            title: "今日警报",
            value: "156",
            trend: "+5%",
            status: "negative",
            icon: AlertTriangle,
            color: "amber",
        },
        {
            title: "存储容量",
            value: "1.2 TB",
            trend: "总 2.0 TB",
            status: "neutral",
            icon: HardDrive,
            color: "slate",
        },
    ];

    return (
        <div className="space-y-8 p-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 统计网格 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((item, index) => (
                    <div
                        key={index}
                        className="group relative p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${item.color}-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-${item.color}-500/10 transition-colors`} />

                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.title}</p>
                                <h3 className="text-4xl font-black mt-2 text-slate-900 tracking-tighter">{item.value}</h3>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status === 'positive' ? 'bg-green-100 text-green-600' :
                                            item.status === 'negative' ? 'bg-amber-100 text-amber-600' :
                                                'bg-slate-100 text-slate-500'
                                        }`}>
                                        {item.trend}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider italic">对比上期</span>
                                </div>
                            </div>
                            <div className={`p-4 rounded-2xl bg-${item.color}-50 text-${item.color}-500 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 监控核心展示区 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Activity className="text-white w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-900">实时监控矩阵</h4>
                                    <p className="text-sm text-slate-400 font-medium">当前活跃通道: 16 路 | 4K 分辨率</p>
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-xl font-bold gap-2">
                                <TrendingUp className="w-4 h-4" />
                                数据分析
                            </Button>
                        </div>

                        <div className="relative aspect-video bg-slate-900 rounded-[2rem] overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-4 z-10">
                                    <div className="inline-flex p-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white cursor-pointer hover:bg-white/20 hover:scale-110 transition-all duration-300 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                                        <Play className="w-10 h-10 fill-current" />
                                    </div>
                                    <p className="text-white/60 font-bold tracking-widest uppercase text-xs">点击加载智能分析引擎</p>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                            </div>

                            {/* 网格装饰线条 */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none"
                                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                        <h5 className="font-black text-slate-900 mb-4 px-2 uppercase tracking-tight text-sm">系统健康度</h5>
                        <div className="space-y-4">
                            {[
                                { label: "CPU 负载", val: 34, color: "blue" },
                                { label: "GPU 运算", val: 82, color: "amber" },
                                { label: "IOPS 读写", val: 12, color: "green" }
                            ].map((h, i) => (
                                <div key={i} className="space-y-2 px-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase text-slate-400">
                                        <span>{h.label}</span>
                                        <span className={`text-${h.color}-500`}>{h.val}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-${h.color}-500 rounded-full transition-all duration-1000`}
                                            style={{ width: `${h.val}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary p-6 rounded-[2rem] text-white shadow-2xl shadow-primary/40 group cursor-pointer hover:-translate-y-1 transition-transform">
                        <h5 className="font-bold mb-2 flex items-center gap-2">
                            在线技术支持
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </h5>
                        <p className="text-xs text-white/70 leading-relaxed font-medium">
                            如果您在系统配置或 AI 算法集成中遇到任何问题，请随时联系我们的技术支持团队。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
