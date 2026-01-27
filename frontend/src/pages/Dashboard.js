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

// Extracted Widget Components
import {
    MainKpisWidget,
    SecondaryKpisWidget,
    RecentActivityWidget,
    AlertsWidget,
    QuickActionsWidget,
    TopCustomersWidget
} from '../components/dashboard/widgets';

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

    /* Render Functions based on ID - Refactored to use extracted components */
    const renderWidget = (id) => {
        switch (id) {
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

            case 'main_kpis':
                return <MainKpisWidget key={id} kpis={kpis} formatCurrency={formatCurrency} formatNumber={formatNumber} />;

            case 'charts':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" key={id}>
                        <div className="lg:col-span-2">
                            <AdvancedChartWidget />
                        </div>
                        <div className="h-full">
                            <SalesDistributionWidget salesByCrop={salesByCrop} loading={loading} />
                        </div>
                    </div>
                );

            case 'secondary_kpis':
                return <SecondaryKpisWidget key={id} kpis={kpis} formatCurrency={formatCurrency} formatNumber={formatNumber} />;

            case 'recent_activity':
                return (
                    <RecentActivityWidget
                        key={id}
                        recentActivities={recentActivities}
                        seasonSummary={seasonSummary}
                        formatCurrency={formatCurrency}
                        formatRelativeTime={formatRelativeTime}
                        formatDate={formatDate}
                    />
                );

            case 'top_customers':
                return <TopCustomersWidget key={id} topCustomers={topCustomers} formatCurrency={formatCurrency} />;

            case 'alerts':
                return <AlertsWidget key={id} alerts={alerts} />;

            case 'quick_actions':
                return <QuickActionsWidget key={id} onOpenCommandPalette={() => setShowCommandPalette(true)} />;

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
