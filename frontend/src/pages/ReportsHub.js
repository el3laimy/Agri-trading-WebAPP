import React from 'react';
import { Link } from 'react-router-dom';

// Import shared components
import { PageHeader } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function ReportsHub() {
    const reports = [
        {
            title: "دفتر الأستاذ العام",
            description: "عرض جميع الحركات المالية وتفاصيل الحسابات",
            icon: "bi-book",
            to: "/general-ledger",
            gradient: "from-emerald-500 to-teal-500",
            iconBg: "bg-emerald-500/20"
        },
        {
            title: "ميزان المراجعة",
            description: "ملخص أرصدة الحسابات الدائنة والمدينة",
            icon: "bi-scale",
            to: "/trial-balance",
            gradient: "from-green-500 to-lime-500",
            iconBg: "bg-green-500/20"
        },
        {
            title: "قائمة الدخل",
            description: "تقرير الأرباح والخسائر والنتائج التشغيلية",
            icon: "bi-graph-up-arrow",
            to: "/income-statement",
            gradient: "from-cyan-500 to-blue-500",
            iconBg: "bg-cyan-500/20"
        },
        {
            title: "الميزانية العمومية",
            description: "المركز المالي للشركة (أصول، خصوم، حقوق ملكية)",
            icon: "bi-bank",
            to: "/balance-sheet",
            gradient: "from-amber-500 to-orange-500",
            iconBg: "bg-amber-500/20"
        },
        {
            title: "التدفقات النقدية",
            description: "تحليل مصادر واستخدامات النقدية في الشركة",
            icon: "bi-cash-stack",
            to: "/cash-flow",
            gradient: "from-violet-500 to-purple-500",
            iconBg: "bg-violet-500/20"
        },
        {
            title: "بيان حقوق الملكية",
            description: "تتبع التغيرات في حقوق الملاك ورأس المال",
            icon: "bi-pie-chart",
            to: "/equity-statement",
            gradient: "from-indigo-500 to-blue-500",
            iconBg: "bg-indigo-500/20"
        },
        {
            title: "مديونيات العملاء والموردين",
            description: "متابعة الديون المستحقة والالتزامات",
            icon: "bi-people",
            to: "/debtors",
            gradient: "from-red-500 to-rose-500",
            iconBg: "bg-red-500/20"
        },
        {
            title: "أداء المحاصيل",
            description: "تحليل ربحية وتكاليف كل محصول على حدة",
            icon: "bi-flower1",
            to: "/crop-performance",
            gradient: "from-lime-500 to-green-500",
            iconBg: "bg-lime-500/20"
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <PageHeader
                title="مركز التقارير المالية"
                subtitle="نظرة شاملة على أداء الشركة ووضعها المالي"
                icon="bi-file-earmark-bar-graph"
                gradient="from-slate-600 to-zinc-700"
            >
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in lg-glass-thin">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-file-earmark-text text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي التقارير</p>
                                <p className="text-lg font-bold">{reports.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in lg-glass-thin" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-check-circle text-lg text-emerald-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">الحالة</p>
                                <p className="text-sm font-bold">محدث</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in lg-glass-thin" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-calendar-date text-lg text-blue-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">التاريخ</p>
                                <p className="text-sm font-bold">{new Date().toLocaleDateString('en-US')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in lg-glass-thin" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-printer text-lg text-purple-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">الطباعة</p>
                                <p className="text-sm font-bold">متاحة</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg-animate-fade">
                {reports.map((report, index) => (
                    <Link
                        key={index}
                        to={report.to}
                        className={`group lg-card lg-hover-lift overflow-hidden lg-animate-in`}
                        style={{ animationDelay: `${Math.min(index, 7) * 80}ms` }}
                    >
                        {/* Card Header Gradient */}
                        <div className={`h-24 bg-gradient-to-br ${report.gradient} relative overflow-hidden`}>
                            {/* Decorative Elements */}
                            <div className="absolute inset-0">
                                <div className="blob h-16 w-16 opacity-30 absolute -top-4 -left-4" />
                                <div className="blob h-20 w-20 opacity-20 absolute -bottom-8 -right-8 animation-delay-2" />
                            </div>
                            {/* Icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`w-16 h-16 rounded-2xl ${report.iconBg} backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <i className={`bi ${report.icon} text-3xl text-white`} />
                                </div>
                            </div>
                        </div>
                        {/* Card Body */}
                        <div className="p-5">
                            <h5 className="font-bold mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--lg-text-primary)' }}>
                                {report.title}
                            </h5>
                            <p className="text-sm line-clamp-2" style={{ color: 'var(--lg-text-muted)' }}>
                                {report.description}
                            </p>
                            {/* Arrow */}
                            <div className="mt-4 flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>عرض التقرير</span>
                                <i className="bi bi-arrow-left mr-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default ReportsHub;
