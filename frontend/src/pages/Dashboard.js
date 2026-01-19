import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

// Import Dashboard Animations CSS
import '../styles/dashboardAnimations.css';

// Dashboard Widgets
import {
    GlassKpiCard,
    MiniStatPill,
    ActivityItem,
    SeasonProgressCard,
    DashboardSkeleton,
    RefreshButton,
    SectionHeader,
    EmptyState,
    HeroSection
} from '../components/dashboard/DashboardWidgets';
import AdvancedChartWidget from '../components/dashboard/charts/AdvancedChartWidget';
import SalesDistributionWidget from '../components/dashboard/charts/SalesDistributionWidget';
import CommandPalette from '../components/dashboard/CommandPalette';

/* --- Widget Definitions --- */
const WIDGETS = [
    { id: 'quick_stats', label: 'إحصائيات اليوم (الشريط العلوي)' },
    { id: 'main_kpis', label: 'المؤشرات الرئيسية (KPIs)' },
    { id: 'charts', label: 'الرسوم البيانية' },
    { id: 'secondary_kpis', label: 'مؤشرات إضافية (ديون وعمليات)' },
    { id: 'recent_activity', label: 'النشاط الأخير' },
    { id: 'top_customers', label: 'أفضل العملاء' },
    { id: 'alerts', label: 'التنبيهات الذكية' },
    { id: 'quick_actions', label: 'الإجراءات السريعة' }
];

const DEFAULT_LAYOUT = ['quick_stats', 'main_kpis', 'charts', 'secondary_kpis', 'recent_activity', 'top_customers', 'alerts', 'quick_actions'];

function Dashboard() {
    const { user, updateConfig } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    // TanStack Query - fetches all dashboard data
    const {
        kpis,
        alerts,
        salesByCrop,
        topCustomers,
        recentActivities,
        seasonSummary,
        balanceCheck,
        isLoading: loading,
        refetchAll
    } = useDashboard();

    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Layout State
    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [tempLayout, setTempLayout] = useState(DEFAULT_LAYOUT);

    // Command Palette State
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير';
        if (hour < 17) return 'مساء الخير';
        return 'مساء الخير';
    };

    // Manual refresh handler
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refetchAll();
            setLastUpdate(new Date());
        } finally {
            setRefreshing(false);
        }
    };

    // Set initial lastUpdate when data loads
    useEffect(() => {
        if (kpis && !lastUpdate) {
            setLastUpdate(new Date());
        }
    }, [kpis, lastUpdate]);

    useEffect(() => {
        if (user && user.dashboard_config) {
            try {
                const config = JSON.parse(user.dashboard_config);
                if (Array.isArray(config) && config.length > 0) {
                    setLayout(config);
                    return;
                }
            } catch (e) {
                console.error("Error parsing dashboard config", e);
            }
        }
        setLayout(DEFAULT_LAYOUT);
    }, [user]);

    // Command Palette Keyboard Shortcut (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSaveConfig = () => {
        setLayout(tempLayout);
        updateConfig(tempLayout);
        setShowConfigModal(false);
    };

    const toggleWidget = (widgetId) => {
        if (tempLayout.includes(widgetId)) {
            setTempLayout(tempLayout.filter(id => id !== widgetId));
        } else {
            setTempLayout([...tempLayout, widgetId]);
        }
    };

    const moveWidget = (index, direction) => {
        const newLayout = [...tempLayout];
        if (direction === 'up' && index > 0) {
            [newLayout[index], newLayout[index - 1]] = [newLayout[index - 1], newLayout[index]];
        } else if (direction === 'down' && index < newLayout.length - 1) {
            [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
        }
        setTempLayout(newLayout);
    };

    // Format Currency
    const formatCurrency = (amount, compact = false) => {
        if (compact && Math.abs(amount) >= 1000000) {
            return new Intl.NumberFormat('ar-EG', {
                minimumFractionDigits: 1, maximumFractionDigits: 1
            }).format(amount / 1000000) + ' م';
        }
        if (compact && Math.abs(amount) >= 1000) {
            return new Intl.NumberFormat('ar-EG', {
                minimumFractionDigits: 0, maximumFractionDigits: 0
            }).format(amount / 1000) + ' ك';
        }
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ar-EG').format(num || 0);
    };

    // Format Date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
    };

    // Format Relative Time
    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return '';
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return formatDate(timestamp);
    };

    // Loading State
    if (loading || !kpis) {
        return (
            <div className="container mx-auto px-4 py-8">
                <DashboardSkeleton />
            </div>
        );
    }

    /* Render Functions based on ID */
    const renderWidget = (id) => {
        switch (id) {
            // =============== HERO HEADER ===============
            case 'quick_stats':
                return (
                    <HeroSection
                        key={id}
                        greeting={getGreeting()}
                        username={user?.username}
                        subtitle="نظرة شاملة على أداء المزرعة والعمليات"
                        balanceCheck={balanceCheck}
                        onNavigate={navigate}
                        onConfigClick={() => { setTempLayout(layout); setShowConfigModal(true); }}
                        onRefresh={handleRefresh}
                        isRefreshing={refreshing}
                        quickStats={[
                            { label: 'مبيعات اليوم', value: formatCurrency(kpis.today_sales, true), icon: 'bi-cart-check' },
                            { label: 'تحصيلات اليوم', value: formatCurrency(kpis.today_collections, true), icon: 'bi-cash-coin' },
                            { label: 'رصيد الخزينة', value: formatCurrency(kpis.cash_balance, true), icon: 'bi-safe2' },
                            { label: 'هامش الربح', value: `${kpis.gross_margin || 0}%`, icon: 'bi-percent' }
                        ]}
                    />
                );

            // =============== MAIN KPIs ===============
            case 'main_kpis':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" key={id}>
                        <GlassKpiCard
                            title="إجمالي الإيرادات"
                            value={kpis.total_revenue}
                            icon="bi-cash-stack"
                            gradient="from-emerald-500 to-teal-500"
                            onClick={() => navigate('/sales')}
                            formatValue={(v) => formatCurrency(v, true)}
                            delay={0}
                        />
                        <GlassKpiCard
                            title="صافي الربح"
                            value={kpis.net_profit}
                            icon="bi-graph-up-arrow"
                            gradient="from-green-500 to-emerald-500"
                            onClick={() => navigate('/reports/income-statement')}
                            formatValue={(v) => formatCurrency(v, true)}
                            delay={100}
                        />
                        <GlassKpiCard
                            title="قيمة المخزون"
                            value={kpis.inventory_value}
                            icon="bi-box-seam"
                            gradient="from-amber-500 to-orange-500"
                            subtitle={`${formatNumber(kpis.total_stock_kg)} كجم`}
                            onClick={() => navigate('/inventory')}
                            formatValue={(v) => formatCurrency(v, true)}
                            delay={200}
                        />
                        <GlassKpiCard
                            title="رصيد الخزينة"
                            value={kpis.cash_balance}
                            icon="bi-wallet2"
                            gradient="from-blue-500 to-cyan-500"
                            onClick={() => navigate('/treasury')}
                            formatValue={(v) => formatCurrency(v, true)}
                            delay={300}
                        />
                    </div>
                );

            // =============== CHARTS ===============
            case 'charts':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" key={id}>
                        <div className="lg:col-span-2">
                            <AdvancedChartWidget />
                        </div>
                        <div className="h-full">
                            <SalesDistributionWidget
                                salesByCrop={salesByCrop}
                                loading={loading}
                            />
                        </div>
                    </div>
                );

            // =============== SECONDARY KPIs ===============
            case 'secondary_kpis':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" key={id}>
                        <GlassKpiCard
                            title="مستحقات من العملاء"
                            value={kpis.total_receivables}
                            icon="bi-person-check"
                            gradient="from-yellow-500 to-amber-500"
                            onClick={() => navigate('/debtors?type=receivables')}
                            subtitle="عملاء مدينين"
                            formatValue={(v) => formatCurrency(v, true)}
                            delay={0}
                        />
                        <GlassKpiCard
                            title="مستحقات للموردين"
                            value={kpis.total_payables}
                            icon="bi-truck"
                            gradient="from-red-500 to-rose-500"
                            onClick={() => navigate('/debtors?type=payables')}
                            subtitle="موردين دائنين"
                            formatValue={(v) => formatCurrency(v, true)}
                            delay={100}
                        />
                        <GlassKpiCard
                            title="عدد المبيعات"
                            value={kpis.sales_count}
                            icon="bi-receipt"
                            gradient="from-purple-500 to-violet-500"
                            subtitle="عملية"
                            formatValue={formatNumber}
                            delay={200}
                        />
                        <GlassKpiCard
                            title="عدد المشتريات"
                            value={kpis.purchases_count}
                            icon="bi-bag"
                            gradient="from-teal-500 to-cyan-500"
                            subtitle="عملية"
                            formatValue={formatNumber}
                            delay={300}
                        />
                    </div>
                );

            // =============== RECENT ACTIVITY ===============
            case 'recent_activity':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" key={id}>
                        {/* Activity Timeline */}
                        <div className="lg:col-span-2 neumorphic overflow-hidden animate-fade-in">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                                        <i className="bi bi-activity text-white text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            النشاط الأخير
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">آخر العمليات المسجلة</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/sales')}
                                    className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors"
                                >
                                    عرض الكل
                                </button>
                            </div>
                            <div className="p-4 max-h-96 overflow-y-auto">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((activity) => (
                                        <ActivityItem
                                            key={activity.id}
                                            activity={activity}
                                            formatCurrency={(v) => formatCurrency(v, true)}
                                            formatRelativeTime={formatRelativeTime}
                                        />
                                    ))
                                ) : (
                                    <EmptyState icon="bi-clock-history" title="لا توجد عمليات حديثة" />
                                )}
                            </div>
                        </div>

                        {/* Season Progress */}
                        <div className="animate-fade-in">
                            <SeasonProgressCard
                                season={seasonSummary}
                                formatDate={formatDate}
                            />
                        </div>
                    </div>
                );

            // =============== TOP CUSTOMERS ===============
            case 'top_customers':
                return (
                    <div className="mb-8" key={id}>
                        <div className="neumorphic overflow-hidden animate-fade-in">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg">
                                        <i className="bi bi-trophy text-white text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                            أفضل العملاء
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">حسب حجم المشتريات</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/contacts')}
                                    className="px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-colors"
                                >
                                    عرض الكل
                                </button>
                            </div>
                            {topCustomers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 text-sm font-semibold">
                                            <tr>
                                                <th className="px-6 py-4 w-16">#</th>
                                                <th className="px-6 py-4">العميل</th>
                                                <th className="px-6 py-4 text-left">إجمالي المشتريات</th>
                                                <th className="px-6 py-4 text-left">عدد العمليات</th>
                                                <th className="px-6 py-4 text-center">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {topCustomers.map((customer, index) => (
                                                <tr
                                                    key={customer.contact_id}
                                                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                                    onClick={() => navigate(`/contacts/${customer.contact_id}`)}
                                                >
                                                    <td className="px-6 py-4">
                                                        {index === 0 && <span className="text-2xl">🥇</span>}
                                                        {index === 1 && <span className="text-2xl">🥈</span>}
                                                        {index === 2 && <span className="text-2xl">🥉</span>}
                                                        {index > 2 && <span className="text-gray-400 font-medium">{index + 1}</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                                                style={{
                                                                    backgroundColor: theme === 'dark' ? `hsl(${customer.contact_id * 40}, 50%, 25%)` : `hsl(${customer.contact_id * 40}, 70%, 90%)`,
                                                                    color: theme === 'dark' ? `hsl(${customer.contact_id * 40}, 70%, 75%)` : `hsl(${customer.contact_id * 40}, 70%, 35%)`
                                                                }}
                                                            >
                                                                {customer.name?.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-gray-700 dark:text-gray-200">{customer.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-left font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(customer.total_purchases)}
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                                                            {customer.transaction_count || '-'} عملية
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {customer.outstanding > 0 ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                                مدين: {formatCurrency(customer.outstanding, true)}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                                مسدد
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8">
                                    <EmptyState icon="bi-people" title="لا توجد بيانات عملاء" />
                                </div>
                            )}
                        </div>
                    </div>
                );

            // =============== ALERTS ===============
            case 'alerts':
                const getAlertStyle = (type) => {
                    const styles = {
                        success: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50',
                        danger: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50',
                        warning: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
                        info: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                    };
                    return styles[type] || styles.info;
                };

                return (
                    <div className="mb-8" key={id}>
                        <div className="neumorphic animate-fade-in">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                                        <i className="bi bi-bell text-white text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            التنبيهات الذكية
                                            {alerts.length > 0 && (
                                                <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-medium animate-pulse">
                                                    {alerts.length}
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">تنبيهات تلقائية للمتابعة</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {alerts.length > 0 ? alerts.map((alert, index) => (
                                        <div key={index} className={`p-4 rounded-xl border-2 flex items-start gap-3 hover-lift ${getAlertStyle(alert.type)}`}>
                                            <div className="w-10 h-10 rounded-lg bg-current bg-opacity-20 flex items-center justify-center flex-shrink-0">
                                                <i className={`bi ${alert.icon} text-xl`} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm mb-1">{alert.title}</p>
                                                <p className="text-sm opacity-80">{alert.message}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full text-center py-12">
                                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <i className="bi bi-check-circle text-4xl text-emerald-500" />
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">لا توجد تنبيهات - كل شيء على ما يرام!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            // =============== QUICK ACTIONS ===============
            case 'quick_actions':
                const actions = [
                    { label: 'بيع جديد', icon: 'bi-cart-plus', gradient: 'from-emerald-500 to-teal-500', path: '/sales' },
                    { label: 'شراء جديد', icon: 'bi-bag-plus', gradient: 'from-blue-500 to-cyan-500', path: '/purchases' },
                    { label: 'الخزينة', icon: 'bi-safe2', gradient: 'from-amber-500 to-orange-500', path: '/treasury' },
                    { label: 'مصروف جديد', icon: 'bi-receipt', gradient: 'from-red-500 to-rose-500', path: '/expenses' },
                    { label: 'تقرير الأرباح', icon: 'bi-graph-up', gradient: 'from-cyan-500 to-blue-500', path: '/reports/income-statement' },
                    { label: 'جهات التعامل', icon: 'bi-people', gradient: 'from-gray-500 to-slate-500', path: '/contacts' },
                    { label: 'المخزون', icon: 'bi-box-seam', gradient: 'from-indigo-500 to-purple-500', path: '/inventory' },
                    { label: 'دفتر الأستاذ', icon: 'bi-journal-bookmark', gradient: 'from-purple-500 to-pink-500', path: '/reports/general-ledger' }
                ];

                return (
                    <div className="mb-8" key={id}>
                        <div className="neumorphic animate-fade-in">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                                            <i className="bi bi-lightning-charge text-white text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                                إجراءات سريعة
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">وصول سريع للعمليات الأساسية</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCommandPalette(true)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <i className="bi bi-search" />
                                        <span>بحث سريع</span>
                                        <kbd className="text-xs px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded border border-gray-200 dark:border-slate-500 font-mono">
                                            Ctrl+K
                                        </kbd>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                    {actions.map((action, index) => (
                                        <button
                                            key={index}
                                            onClick={() => navigate(action.path)}
                                            className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-gray-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-gray-100 dark:hover:border-slate-600"
                                        >
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                                                <i className={`bi ${action.icon} text-white text-2xl`} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Render Widgets */}
            {layout.map(id => renderWidget(id))}

            {/* Command Palette */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
            />

            {/* Config Modal */}
            {showConfigModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowConfigModal(false)} />

                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-200 dark:border-slate-700 animate-fade-in-scale">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <i className="bi bi-gear text-emerald-600 dark:text-emerald-400" />
                                    تخصيص لوحة التحكم
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">اختر العناصر وقم بترتيبها</p>
                            </div>

                            <div className="p-6 max-h-96 overflow-y-auto">
                                <ul className="space-y-2">
                                    {tempLayout.map((id, index) => {
                                        const widget = WIDGETS.find(w => w.id === id);
                                        return (
                                            <li key={id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex justify-between items-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={true}
                                                        onChange={() => toggleWidget(id)}
                                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-slate-600 focus:ring-emerald-500"
                                                    />
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{widget?.label || id}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() => moveWidget(index, 'up')}
                                                        className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg disabled:opacity-30 transition-colors"
                                                    >
                                                        <i className="bi bi-arrow-up" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={index === tempLayout.length - 1}
                                                        onClick={() => moveWidget(index, 'down')}
                                                        className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg disabled:opacity-30 transition-colors"
                                                    >
                                                        <i className="bi bi-arrow-down" />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                    {WIDGETS.filter(w => !tempLayout.includes(w.id)).map(widget => (
                                        <li key={widget.id} className="p-3 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center gap-3 opacity-60">
                                            <input
                                                type="checkbox"
                                                checked={false}
                                                onChange={() => toggleWidget(widget.id)}
                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-slate-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-gray-500 dark:text-gray-400">{widget.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowConfigModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveConfig}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                    <i className="bi bi-check-lg" />
                                    حفظ التغييرات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
