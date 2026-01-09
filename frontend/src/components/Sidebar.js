import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
    const [openMenus, setOpenMenus] = useState({ reports: true, settings: false, system: false });

    const toggleMenu = (menuName) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuName]: !prev[menuName]
        }));
    };

    // العمليات اليومية الأساسية
    const dailyOperations = [
        { path: '/dashboard', label: 'لوحة التحكم', icon: 'bi-speedometer2' },
        { path: '/treasury', label: 'الخزينة اليومية', icon: 'bi-wallet2' },
        { path: '/sales', label: 'المبيعات', icon: 'bi-cart-check' },
        { path: '/purchases', label: 'المشتريات', icon: 'bi-bag-check' },
        { path: '/expenses', label: 'المصروفات', icon: 'bi-cash-coin' },
    ];

    // إدارة المخزون
    const inventoryItems = [
        { path: '/inventory', label: 'عرض المخزون', icon: 'bi-box-seam' },
        { path: '/inventory-adjustments', label: 'تسوية المخزون', icon: 'bi-sliders' },
    ];

    // التقارير المالية
    const reports = [
        { path: '/reports', label: 'مركز التقارير', icon: 'bi-grid-1x2-fill' },
        { path: '/crop-performance', label: 'أداء المحاصيل', icon: 'bi-flower1' },
        { path: '/capital-distribution', label: 'توزيع رأس المال', icon: 'bi-pie-chart-fill' },
        { path: '/reports/income-statement', label: 'قائمة الدخل', icon: 'bi-graph-up' },
        { path: '/reports/balance-sheet', label: 'الميزانية العمومية', icon: 'bi-bank' },
        { path: '/reports/cash-flow', label: 'التدفقات النقدية', icon: 'bi-arrow-left-right' },
        { path: '/debtors', label: 'الديون والالتزامات', icon: 'bi-people' },
    ];

    // الإعدادات
    const settings = [
        { path: '/crops', label: 'المحاصيل', icon: 'bi-flower1' },
        { path: '/contacts', label: 'جهات التعامل', icon: 'bi-people' },
        { path: '/financial-accounts', label: 'الحسابات المالية', icon: 'bi-credit-card' },
        { path: '/seasons', label: 'المواسم', icon: 'bi-calendar-range' },
        { path: '/daily-prices', label: 'الأسعار اليومية', icon: 'bi-currency-exchange' },
        { path: '/journal', label: 'قيود اليومية', icon: 'bi-journal-text' },
    ];

    // إدارة النظام
    const system = [
        { path: '/backups', label: 'النسخ الاحتياطي', icon: 'bi-database-fill-gear' },
    ];

    const NavItem = ({ item, isSubItem = false }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center rounded-lg transition-all duration-200 mb-0.5
                ${isSubItem ? 'text-white/70 py-2 pr-4 text-sm' : 'text-white py-2 px-3 text-[0.95rem]'}
                ${isActive && !isSubItem ? 'bg-white/15' : 'hover:bg-white/5'}
                ${isActive && isSubItem ? 'text-white bg-white/10' : ''}
                `
            }
        >
            <i className={`bi ${item.icon} ml-2 ${isSubItem ? 'text-sm' : 'text-base'}`}></i>
            <span>{item.label}</span>
        </NavLink>
    );

    const MenuSection = ({ title, icon, items, menuKey }) => (
        <div className="mb-2">
            <button
                className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-white transition-all duration-200 
                    ${openMenus[menuKey] ? 'bg-white/10' : 'hover:bg-white/5'}`}
                onClick={() => toggleMenu(menuKey)}
            >
                <div className="flex items-center">
                    <i className={`bi ${icon} ml-2`}></i>
                    <span>{title}</span>
                </div>
                <i className={`bi bi-chevron-${openMenus[menuKey] ? 'up' : 'down'} text-xs transition-transform duration-200`}></i>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openMenus[menuKey] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <ul className="flex flex-col mr-3 mt-1 pr-2 border-r-2 border-[#C4A35A]/30">
                    {items.map(item => (
                        <li key={item.path}>
                            <NavItem item={item} isSubItem={true} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    return (
        <div className="h-screen fixed right-0 top-0 overflow-y-auto z-50 text-white shadow-2xl flex flex-col w-64 bg-gradient-to-b from-[#1E5631] to-[#0D3320]">

            {/* Logo Section */}
            <div className="p-3">
                <a href="/" className="flex items-center p-2 rounded-lg bg-white/10 mb-4 hover:bg-white/20 transition-colors no-underline text-white">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-11 h-11 rounded-lg ml-3 object-cover shadow-md"
                    />
                    <div>
                        <span className="font-bold block text-lg leading-tight">
                            المحاسبة الزراعية
                        </span>
                        <small className="text-white/50 text-xs">
                            نظام إدارة متكامل
                        </small>
                    </div>
                </a>

                <hr className="border-white/15 mb-4" />

                {/* Navigation */}
                <nav className="flex-grow space-y-4">
                    {/* العمليات اليومية */}
                    <div>
                        <small className="text-white/50 uppercase font-bold px-2 block mb-2 text-[0.7rem] tracking-wider">
                            العمليات اليومية
                        </small>
                        <ul className="space-y-1">
                            {dailyOperations.map(item => (
                                <li key={item.path}>
                                    <NavItem item={item} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* المخزون */}
                    <div>
                        <small className="text-white/50 uppercase font-bold px-2 block mb-2 text-[0.7rem] tracking-wider">
                            المخزون
                        </small>
                        <ul className="space-y-1">
                            {inventoryItems.map(item => (
                                <li key={item.path}>
                                    <NavItem item={item} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* التقارير */}
                    <MenuSection
                        title="التقارير المالية"
                        icon="bi-file-earmark-bar-graph"
                        items={reports}
                        menuKey="reports"
                    />

                    {/* الإعدادات */}
                    <MenuSection
                        title="الإعدادات"
                        icon="bi-gear"
                        items={settings}
                        menuKey="settings"
                    />

                    {/* النظام */}
                    <MenuSection
                        title="النظام"
                        icon="bi-shield-lock"
                        items={[
                            ...system,
                            { path: '/users', label: 'المستخدمين', icon: 'bi-people-fill' }
                        ]}
                        menuKey="system"
                    />
                </nav>
            </div>

            {/* Logout and Shutdown Actions */}
            <div className="mt-auto p-3 pb-4">
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }}
                    className="w-full flex items-center justify-center text-white mb-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm"
                >
                    <i className="bi bi-box-arrow-right ml-2"></i>
                    تسجيل الخروج
                </button>

                <button
                    onClick={async () => {
                        if (window.confirm('هل أنت متأكد من إغلاق النظام؟')) {
                            try {
                                const token = localStorage.getItem('token');
                                await fetch('http://localhost:8000/api/v1/system/shutdown', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                alert('تم إرسال أمر الإغلاق. يمكنك الآن إغلاق المتصفح.');
                                window.close();
                            } catch (e) {
                                console.error(e);
                                alert('فشل في إغلاق الخادم');
                            }
                        }
                    }}
                    className="w-full flex items-center justify-center text-white py-2 rounded-lg bg-red-600/80 hover:bg-red-600 border-none transition-all text-sm shadow-md"
                >
                    <i className="bi bi-power ml-2"></i>
                    إغلاق النظام
                </button>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 text-center">
                <small className="text-white/50 text-xs">الإصدار 2.0</small>
            </div>
        </div>
    );
}

export default Sidebar;
