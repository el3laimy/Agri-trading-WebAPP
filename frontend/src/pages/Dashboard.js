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

const DEFAULT_LAYOUT = ['quick_stats', 'quick_actions', 'main_kpis', 'charts', 'secondary_kpis', 'recent_activity', 'top_customers', 'alerts'];

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
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 1, maximumFractionDigits: 1
            }).format(amount / 1000000) + ' م';
        }
        if (compact && Math.abs(amount) >= 1000) {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0, maximumFractionDigits: 0
            }).format(amount / 1000) + ' ك';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num || 0);
    };

    // Format Date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', numberingSystem: 'latn' });
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
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" key={id}>
                        <div className="lg:col-span-2">
                            <TopCustomersWidget topCustomers={topCustomers} formatCurrency={formatCurrency} />
                        </div>
                        <div>
                            <AlertsWidget alerts={alerts} />
                        </div>
                    </div>
                );

            case 'alerts':
                // Alerts are now rendered inside top_customers row
                return null;

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
                <div className="lg-modal-overlay" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="lg-modal" style={{ maxWidth: '520px' }}>
                        <div className="lg-modal-header">
                            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                                <i className="bi bi-gear" style={{ color: 'var(--lg-primary)' }} />
                                تخصيص لوحة التحكم
                            </h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--lg-text-muted)' }}>اختر العناصر وقم بترتيبها</p>
                        </div>

                        <div className="lg-modal-body max-h-96 overflow-y-auto lg-scrollbar">
                            <ul className="space-y-2">
                                {tempLayout.map((id, index) => {
                                    const widget = WIDGETS.find(w => w.id === id);
                                    return (
                                        <li key={id}
                                            className="p-3 rounded-xl flex justify-between items-center"
                                            style={{
                                                background: 'var(--lg-glass-bg)',
                                                border: '1px solid var(--lg-glass-border-subtle)',
                                                transition: 'var(--lg-transition-fast)'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={true}
                                                    onChange={() => toggleWidget(id)}
                                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-slate-600 focus:ring-emerald-500"
                                                />
                                                <span className="font-medium" style={{ color: 'var(--lg-text-primary)' }}>{widget?.label || id}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveWidget(index, 'up')}
                                                    className="lg-btn lg-btn-ghost p-2 disabled:opacity-30"
                                                >
                                                    <i className="bi bi-arrow-up" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === tempLayout.length - 1}
                                                    onClick={() => moveWidget(index, 'down')}
                                                    className="lg-btn lg-btn-ghost p-2 disabled:opacity-30"
                                                >
                                                    <i className="bi bi-arrow-down" />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                                {WIDGETS.filter(w => !tempLayout.includes(w.id)).map(widget => (
                                    <li key={widget.id}
                                        className="p-3 rounded-xl flex items-center gap-3 opacity-60"
                                        style={{ background: 'var(--lg-glass-bg)' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={false}
                                            onChange={() => toggleWidget(widget.id)}
                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 dark:border-slate-600 focus:ring-emerald-500"
                                        />
                                        <span style={{ color: 'var(--lg-text-muted)' }}>{widget.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="lg-modal-footer">
                            <button
                                type="button"
                                onClick={() => setShowConfigModal(false)}
                                className="lg-btn lg-btn-secondary px-4 py-2"
                                style={{ borderRadius: 'var(--lg-radius-sm)' }}
                            >
                                إلغاء
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveConfig}
                                className="lg-btn lg-btn-primary px-4 py-2 flex items-center gap-2"
                            >
                                <i className="bi bi-check-lg" />
                                حفظ التغييرات
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
