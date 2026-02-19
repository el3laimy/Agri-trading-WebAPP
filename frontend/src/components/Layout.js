import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import { useTheme } from '../context/ThemeContext';
import QuickSearch from './common/QuickSearch';
import '../styles/liquidglass.css';

function Layout({ children }) {
    const { theme, toggleTheme } = useTheme();
    const [showQuickSearch, setShowQuickSearch] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Page titles mapping
    const pageTitles = {
        '/dashboard': 'لوحة التحكم',
        '/sales': 'إدارة المبيعات',
        '/purchases': 'إدارة المشتريات',
        '/treasury': 'إدارة الخزينة',
        '/expenses': 'إدارة المصروفات',
        '/inventory': 'المخزون',
        '/inventory-adjustments': 'تسوية المخزون',
        '/contacts': 'جهات التعامل',
        '/crops': 'إدارة المحاصيل',
        '/journal': 'القيود اليومية',
        '/reports': 'مركز التقارير',
        '/general-ledger': 'دفتر الأستاذ العام',
        '/trial-balance': 'ميزان المراجعة',
        '/income-statement': 'قائمة الدخل',
        '/balance-sheet': 'الميزانية العمومية',
        '/equity-statement': 'قائمة حقوق الملكية',
        '/capital-distribution': 'توزيع رأس المال',
        '/cash-flow': 'التدفقات النقدية',
        '/debtors': 'إدارة المديونيات',
        '/crop-performance': 'أداء المحاصيل',
        '/cardex': 'تقرير الكاردكس',
        '/seasons': 'إدارة المواسم',
        '/daily-prices': 'الأسعار اليومية',
        '/financial-accounts': 'الحسابات المالية',
        '/users': 'إدارة المستخدمين',
        '/backups': 'النسخ الاحتياطية',
        '/transformations': 'التحويلات',
    };

    const getPageTitle = () => {
        if (pageTitles[location.pathname]) return pageTitles[location.pathname];
        if (location.pathname.startsWith('/contacts/')) return 'تفاصيل جهة التعامل';
        return 'لوحة التحكم';
    };

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Global keyboard shortcut for Quick Search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowQuickSearch(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors duration-300" dir="rtl">
            {/* Skip to Content - Accessibility */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:shadow-lg">
                انتقل للمحتوى الرئيسي
            </a>

            <QuickSearch isOpen={showQuickSearch} onClose={() => setShowQuickSearch(false)} />

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
                    style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <nav className={`
                fixed inset-y-0 right-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `} aria-label="القائمة الرئيسية">
                <Sidebar />
            </nav>

            {/* Main Content Area */}
            <div className="flex-grow w-full min-w-0 transition-all duration-300">
                {/* LiquidGlass Header */}
                <header className="lg-header p-4 mb-6 flex justify-between items-center sticky top-0 z-30 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            className="lg-btn lg-btn-ghost md:hidden p-2 rounded-lg"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label={isSidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                            aria-expanded={isSidebarOpen}
                        >
                            <i className="bi bi-list text-2xl" aria-hidden="true"></i>
                        </button>

                        <h5 className="m-0 font-bold text-lg truncate" style={{ color: 'var(--lg-text-primary)' }}>{getPageTitle()}</h5>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Quick Search Button */}
                        <button
                            className="lg-btn lg-btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm"
                            style={{ borderRadius: 'var(--lg-radius-sm)' }}
                            onClick={() => setShowQuickSearch(true)}
                            title="بحث سريع (Ctrl+K)"
                        >
                            <i className="bi bi-search"></i>
                            <span className="hidden lg:inline font-medium">بحث</span>
                            <kbd className="hidden lg:inline-block px-2 py-0.5 rounded text-xs font-sans opacity-60 border mx-1"
                                style={{ borderColor: 'var(--lg-glass-border-subtle)', background: 'rgba(0,0,0,0.04)' }}>
                                Ctrl+K
                            </kbd>
                        </button>

                        {/* Theme Toggle */}
                        <button
                            className="lg-btn lg-btn-icon"
                            onClick={toggleTheme}
                            aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
                            title="تغيير الوضع"
                        >
                            <i className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'} text-lg`} aria-hidden="true"></i>
                        </button>

                        <div className="lg-divider h-8 mx-1 hidden sm:block" style={{ width: '1px', margin: '0 4px' }}></div>

                        <NotificationCenter />

                        {/* Connection Status */}
                        <div className="hidden sm:flex lg-badge lg-badge--success items-center gap-2 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            متصل
                        </div>
                    </div>
                </header>

                <main id="main-content" className="p-4 md:p-6 max-w-7xl mx-auto overflow-x-hidden" role="main">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
