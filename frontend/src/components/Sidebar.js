import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Import CSS animations
import '../styles/dashboardAnimations.css';

function Sidebar() {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({
        reports: location.pathname.includes('report') || location.pathname.includes('ledger') || location.pathname.includes('balance') || location.pathname.includes('income') || location.pathname.includes('cash-flow') || location.pathname.includes('debtors'),
        settings: location.pathname.includes('crops') || location.pathname.includes('contacts') || location.pathname.includes('seasons') || location.pathname.includes('financial-accounts') || location.pathname.includes('users')
    });

    const toggleMenu = (menuName) => {
        setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
    };

    // ==================== هيكل القائمة الجديد ====================

    // العمليات اليومية - الأكثر استخداماً
    const mainOperations = [
        { path: '/dashboard', label: 'لوحة التحكم', icon: 'bi-speedometer2', color: 'from-emerald-500 to-teal-500' },
        { path: '/sales', label: 'المبيعات', icon: 'bi-cart-check', color: 'from-green-500 to-emerald-500' },
        { path: '/purchases', label: 'المشتريات', icon: 'bi-bag-check', color: 'from-blue-500 to-cyan-500' },
        { path: '/treasury', label: 'الخزينة', icon: 'bi-wallet2', color: 'from-amber-500 to-yellow-500' },
        { path: '/expenses', label: 'المصروفات', icon: 'bi-cash-coin', color: 'from-rose-500 to-red-500' },
    ];

    // المخزون وجهات التعامل
    const dataManagement = [
        { path: '/inventory', label: 'المخزون', icon: 'bi-box-seam', color: 'from-indigo-500 to-purple-500' },
        { path: '/contacts', label: 'جهات التعامل', icon: 'bi-people', color: 'from-fuchsia-500 to-pink-500' },
    ];

    // التقارير - قائمة قابلة للطي
    const reports = [
        { path: '/reports', label: 'مركز التقارير', icon: 'bi-grid-1x2-fill' },
        { path: '/general-ledger', label: 'دفتر الأستاذ', icon: 'bi-book' },
        { path: '/trial-balance', label: 'ميزان المراجعة', icon: 'bi-scale' },
        { path: '/income-statement', label: 'قائمة الدخل', icon: 'bi-graph-up' },
        { path: '/debtors', label: 'المديونيات', icon: 'bi-cash-stack' },
        { path: '/crop-performance', label: 'أداء المحاصيل', icon: 'bi-flower1' },
    ];

    // الإعدادات - قائمة قابلة للطي
    const settings = [
        { path: '/crops', label: 'المحاصيل', icon: 'bi-flower2' },
        { path: '/seasons', label: 'المواسم', icon: 'bi-calendar-range' },
        { path: '/daily-prices', label: 'الأسعار اليومية', icon: 'bi-currency-exchange' },
        { path: '/financial-accounts', label: 'الحسابات المالية', icon: 'bi-bank' },
        { path: '/users', label: 'المستخدمين', icon: 'bi-person-badge' },
    ];

    // ==================== المكونات ====================

    const NavItem = ({ item, isMain = false }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isMain ? 'text-white/90' : 'text-white/70 text-sm mr-2'}
                ${isActive
                    ? 'bg-white/20 text-white shadow-lg shadow-black/10'
                    : 'hover:bg-white/10 hover:text-white'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                        ${isActive
                            ? `bg-gradient-to-br ${item.color || 'from-white/30 to-white/10'} shadow-md`
                            : 'bg-white/10 group-hover:bg-white/15'
                        }`}
                    >
                        <i className={`bi ${item.icon} ${isMain ? 'text-base' : 'text-sm'}`} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white mr-auto animate-pulse" />}
                </>
            )}
        </NavLink>
    );

    const SubNavItem = ({ item }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200
                ${isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
            }
        >
            <i className={`bi ${item.icon} text-xs`} />
            <span>{item.label}</span>
        </NavLink>
    );

    const MenuSection = ({ title, icon, items, menuKey, badge }) => (
        <div className="mb-1">
            <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${openMenus[menuKey] ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                onClick={() => toggleMenu(menuKey)}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/10`}>
                    <i className={`bi ${icon}`} />
                </div>
                <span className="font-medium">{title}</span>
                {badge && <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 mr-auto">{badge}</span>}
                <i className={`bi bi-chevron-${openMenus[menuKey] ? 'up' : 'down'} text-xs opacity-50 transition-transform duration-200 mr-auto`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openMenus[menuKey] ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="mr-4 pr-3 border-r border-white/10 space-y-0.5">
                    {items.map(item => (
                        <SubNavItem key={item.path} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );

    const SectionLabel = ({ children }) => (
        <div className="px-3 py-2 mt-4 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{children}</span>
        </div>
    );

    // ==================== العرض ====================

    return (
        <div className="h-screen fixed right-0 top-0 overflow-hidden z-50 flex flex-col w-64">
            {/* Background with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A4D2E] via-[#164028] to-[#0F2F1D]" />

            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute top-1/3 -left-10 w-32 h-32 rounded-full bg-teal-500/10 blur-3xl" />
                <div className="absolute bottom-20 -right-10 w-36 h-36 rounded-full bg-emerald-600/10 blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative flex flex-col h-full">
                {/* Logo */}
                <div className="p-4">
                    <a href="/" className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 no-underline text-white group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <i className="bi bi-flower1 text-2xl text-white" />
                        </div>
                        <div>
                            <span className="font-bold block text-lg leading-tight">المحاسبة الزراعية</span>
                            <small className="text-white/50 text-xs">نظام إدارة متكامل</small>
                        </div>
                    </a>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
                    {/* العمليات الرئيسية */}
                    <SectionLabel>العمليات الرئيسية</SectionLabel>
                    <div className="space-y-1">
                        {mainOperations.map(item => (
                            <NavItem key={item.path} item={item} isMain={true} />
                        ))}
                    </div>

                    {/* البيانات */}
                    <SectionLabel>البيانات</SectionLabel>
                    <div className="space-y-1">
                        {dataManagement.map(item => (
                            <NavItem key={item.path} item={item} isMain={true} />
                        ))}
                    </div>

                    {/* التقارير */}
                    <SectionLabel>التقارير والإعدادات</SectionLabel>
                    <MenuSection
                        title="التقارير"
                        icon="bi-bar-chart-line"
                        items={reports}
                        menuKey="reports"
                        badge={reports.length}
                    />
                    <MenuSection
                        title="الإعدادات"
                        icon="bi-gear"
                        items={settings}
                        menuKey="settings"
                    />
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-white/10 bg-black/10 backdrop-blur-sm">
                    <button
                        onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 text-sm font-medium"
                    >
                        <i className="bi bi-box-arrow-right" />
                        تسجيل الخروج
                    </button>
                </div>

                {/* Version */}
                <div className="p-2 text-center">
                    <span className="text-[10px] text-white/30">v2.0 · جميع الحقوق محفوظة</span>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    );
}

export default Sidebar;
