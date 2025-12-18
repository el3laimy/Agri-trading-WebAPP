import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardKpis, getDashboardAlerts, getSalesByCrop, getTopCustomers } from '../api/reports';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

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

const DEFAULT_LAYOUT = ['quick_stats', 'main_kpis', 'charts', 'secondary_kpis', 'top_customers', 'alerts', 'quick_actions'];

function Dashboard() {
    const { user, updateConfig } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [kpis, setKpis] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [salesByCrop, setSalesByCrop] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Layout State
    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [tempLayout, setTempLayout] = useState(DEFAULT_LAYOUT);

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير';
        if (hour < 17) return 'مساء الخير';
        return 'مساء الخير';
    };

    const fetchData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [kpisData, alertsData, salesData, customersData] = await Promise.all([
                getDashboardKpis(),
                getDashboardAlerts().catch(() => []),
                getSalesByCrop().catch(() => []),
                getTopCustomers(5).catch(() => [])
            ]);
            setKpis(kpisData);
            setAlerts(alertsData);
            setSalesByCrop(salesData);
            setTopCustomers(customersData);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 5 minutes
        const interval = setInterval(() => fetchData(true), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

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

    const formatCurrency = (amount, compact = false) => {
        if (compact && Math.abs(amount) >= 1000000) {
            return new Intl.NumberFormat('ar-EG', {
                style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1
            }).format(amount / 1000000) + 'م';
        }
        if (compact && Math.abs(amount) >= 1000) {
            return new Intl.NumberFormat('ar-EG', {
                style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0
            }).format(amount / 1000) + 'ك';
        }
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency', currency: 'EGP', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ar-EG').format(num || 0);
    };

    // Calculate trend (mock - in real app, compare with previous period)
    const getTrend = (value) => {
        // This would normally compare with previous period
        if (value > 0) return { direction: 'up', color: '#28A745', icon: 'bi-arrow-up-short' };
        if (value < 0) return { direction: 'down', color: '#DC3545', icon: 'bi-arrow-down-short' };
        return { direction: 'stable', color: '#6C757D', icon: 'bi-dash' };
    };

    if (loading || !kpis) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                        <span className="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p className="text-muted">جاري تحميل لوحة التحكم...</p>
                </div>
            </div>
        );
    }

    // --- Enhanced KPI Card Component ---
    const KpiCard = ({ title, value, icon, color, formatAsCurrency = true, onClick, subtitle, trend, compact = false }) => (
        <div className="col-md-6 col-lg-3 mb-4">
            <div
                className="card border-0 shadow-sm h-100 kpi-card-enhanced"
                onClick={onClick}
                style={{
                    cursor: onClick ? 'pointer' : 'default',
                    borderRight: `4px solid ${color}`,
                    transition: 'all 0.3s ease'
                }}
            >
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <p className="text-muted mb-1 small">{title}</p>
                            <h4 className="fw-bold mb-0" style={{ color }}>
                                {formatAsCurrency ? formatCurrency(value, compact) : formatNumber(value)}
                            </h4>
                            {subtitle && <small className="text-muted">{subtitle}</small>}
                        </div>
                        <div className="p-2 rounded-circle" style={{ backgroundColor: `${color}15` }}>
                            <i className={`bi ${icon} fs-4`} style={{ color }}></i>
                        </div>
                    </div>
                    {trend && (
                        <div className="mt-2 pt-2 border-top">
                            <small style={{ color: getTrend(trend).color }}>
                                <i className={`bi ${getTrend(trend).icon}`}></i>
                                {Math.abs(trend)}% عن الفترة السابقة
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // --- Mini Stat Card for Quick Stats ---
    const MiniStat = ({ label, value, icon, trend }) => (
        <div className="col-md-3 col-6">
            <div className="text-center px-3 py-2 h-100" style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="d-flex align-items-center justify-content-center mb-1">
                    <i className={`bi ${icon} me-2 opacity-75`}></i>
                    <small className="text-white-50">{label}</small>
                </div>
                <h5 className="fw-bold mb-0">{value}</h5>
            </div>
        </div>
    );

    /* Render Functions based on ID */
    const renderWidget = (id) => {
        switch (id) {
            case 'quick_stats':
                return (
                    <div className="row mb-4" key={id}>
                        <div className="col-12">
                            <div
                                className="card border-0 shadow-sm"
                                style={{
                                    background: 'linear-gradient(135deg, #1E5631 0%, #2D7A4A 50%, #3D8B4F 100%)',
                                    borderRadius: '16px'
                                }}
                            >
                                <div className="card-body text-white py-4">
                                    <div className="row g-0">
                                        <MiniStat
                                            label="مبيعات اليوم"
                                            value={formatCurrency(kpis.today_sales, true)}
                                            icon="bi-cart-check"
                                        />
                                        <MiniStat
                                            label="تحصيلات اليوم"
                                            value={formatCurrency(kpis.today_collections, true)}
                                            icon="bi-cash-coin"
                                        />
                                        <MiniStat
                                            label="رصيد الخزينة"
                                            value={formatCurrency(kpis.cash_balance, true)}
                                            icon="bi-safe2"
                                        />
                                        <MiniStat
                                            label="هامش الربح"
                                            value={`${kpis.gross_margin || 0}%`}
                                            icon="bi-percent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'main_kpis':
                return (
                    <div className="row" key={id}>
                        <KpiCard
                            title="إجمالي الإيرادات"
                            value={kpis.total_revenue}
                            icon="bi-cash-stack"
                            color="#1E5631"
                            onClick={() => navigate('/sales')}
                            compact
                        />
                        <KpiCard
                            title="صافي الربح"
                            value={kpis.net_profit}
                            icon="bi-graph-up-arrow"
                            color="#28A745"
                            onClick={() => navigate('/reports/income-statement')}
                            compact
                        />
                        <KpiCard
                            title="قيمة المخزون"
                            value={kpis.inventory_value}
                            icon="bi-box-seam"
                            color="#C4A35A"
                            subtitle={`${formatNumber(kpis.total_stock_kg)} كجم`}
                            onClick={() => navigate('/inventory')}
                            compact
                        />
                        <KpiCard
                            title="رصيد الخزينة"
                            value={kpis.cash_balance}
                            icon="bi-wallet2"
                            color="#17A2B8"
                            onClick={() => navigate('/treasury')}
                            compact
                        />
                    </div>
                );

            case 'charts':
                const revenueExpenseData = {
                    labels: ['الإيرادات', 'تكلفة المبيعات', 'المصروفات', 'صافي الربح'],
                    datasets: [{
                        label: 'المبالغ (ج.م)',
                        data: [kpis.total_revenue, kpis.total_revenue - kpis.gross_profit, kpis.total_expenses, kpis.net_profit],
                        backgroundColor: [
                            'rgba(30, 86, 49, 0.8)',
                            'rgba(220, 53, 69, 0.8)',
                            'rgba(255, 193, 7, 0.8)',
                            'rgba(40, 167, 69, 0.8)'
                        ],
                        borderRadius: 8,
                        borderWidth: 0
                    }]
                };

                const salesByCropChartData = {
                    labels: salesByCrop.map(s => s.crop),
                    datasets: [{
                        data: salesByCrop.map(s => s.total),
                        backgroundColor: [
                            '#1E5631',
                            '#C4A35A',
                            '#3D8B4F',
                            '#8D6E63',
                            '#4CAF50',
                            '#FDD835',
                            '#26A69A',
                            '#7CB342'
                        ],
                        borderWidth: 0
                    }]
                };

                const chartTextColor = theme === 'dark' ? '#CBD5E1' : '#475569';
                const chartGridColor = theme === 'dark' ? '#334155' : '#E2E8F0';

                const chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: chartTextColor,
                                font: { family: 'Cairo', size: 12 },
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: theme === 'dark' ? '#1E293B' : 'rgba(0,0,0,0.8)',
                            titleColor: theme === 'dark' ? '#F8FAFC' : '#fff',
                            bodyColor: theme === 'dark' ? '#CBD5E1' : '#fff',
                            titleFont: { family: 'Cairo' },
                            bodyFont: { family: 'Cairo' },
                            padding: 12,
                            cornerRadius: 8,
                            borderColor: theme === 'dark' ? '#334155' : 'transparent',
                            borderWidth: 1
                        }
                    }
                };

                return (
                    <div className="row mt-2" key={id}>
                        <div className="col-lg-7 mb-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-transparent border-0 py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                                            <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
                                            ملخص الأداء المالي
                                        </h5>
                                        <span className="badge bg-light text-dark">
                                            <i className="bi bi-calendar me-1"></i>
                                            الموسم الحالي
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '300px' }}>
                                        <Bar
                                            data={revenueExpenseData}
                                            options={{
                                                ...chartOptions,
                                                indexAxis: 'y',
                                                scales: {
                                                    x: {
                                                        grid: { display: false, drawBorder: false },
                                                        ticks: {
                                                            color: chartTextColor,
                                                            font: { family: 'Cairo' },
                                                            callback: (value) => formatCurrency(value, true)
                                                        }
                                                    },
                                                    y: {
                                                        grid: { color: chartGridColor, borderDash: [5, 5], drawBorder: false },
                                                        ticks: {
                                                            color: chartTextColor,
                                                            font: { family: 'Cairo' }
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-5 mb-4">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-transparent border-0 py-3">
                                    <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                                        <i className="bi bi-pie-chart-fill me-2 text-success"></i>
                                        المبيعات حسب المحصول
                                    </h5>
                                </div>
                                <div className="card-body d-flex align-items-center justify-content-center">
                                    {salesByCrop.length > 0 ? (
                                        <div style={{ height: '300px', width: '100%' }}>
                                            <Doughnut
                                                data={salesByCropChartData}
                                                options={{
                                                    ...chartOptions,
                                                    cutout: '65%',
                                                    plugins: {
                                                        ...chartOptions.plugins,
                                                        tooltip: {
                                                            ...chartOptions.plugins.tooltip,
                                                            callbacks: {
                                                                label: (context) => {
                                                                    return `${context.label}: ${formatCurrency(context.raw)}`;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            <i className="bi bi-pie-chart display-4 mb-3 d-block opacity-25"></i>
                                            <p>لا توجد بيانات مبيعات</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'secondary_kpis':
                return (
                    <div className="row" key={id}>
                        <KpiCard
                            title="مستحقات من العملاء"
                            value={kpis.total_receivables}
                            icon="bi-person-check"
                            color="#FFC107"
                            onClick={() => navigate('/debtors?type=receivables')}
                            subtitle="عملاء مدينين"
                            compact
                        />
                        <KpiCard
                            title="مستحقات للموردين"
                            value={kpis.total_payables}
                            icon="bi-truck"
                            color="#DC3545"
                            onClick={() => navigate('/debtors?type=payables')}
                            subtitle="موردين دائنين"
                            compact
                        />
                        <KpiCard
                            title="عدد المبيعات"
                            value={kpis.sales_count}
                            icon="bi-receipt"
                            color="#6F42C1"
                            formatAsCurrency={false}
                            subtitle="عملية"
                        />
                        <KpiCard
                            title="عدد المشتريات"
                            value={kpis.purchases_count}
                            icon="bi-bag"
                            color="#20C997"
                            formatAsCurrency={false}
                            subtitle="عملية"
                        />
                    </div>
                );

            case 'top_customers':
                return (
                    <div className="row" key={id}>
                        <div className="col-12">
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-transparent border-0 py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                                            <i className="bi bi-trophy-fill me-2 text-warning"></i>
                                            أفضل العملاء
                                        </h5>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => navigate('/contacts')}
                                        >
                                            عرض الكل
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body p-0">
                                    {topCustomers.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ width: '5%' }}>#</th>
                                                        <th>العميل</th>
                                                        <th className="text-end">إجمالي المشتريات</th>
                                                        <th className="text-end">عدد العمليات</th>
                                                        <th className="text-center">الحالة</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topCustomers.map((customer, index) => (
                                                        <tr
                                                            key={customer.contact_id}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => navigate(`/contacts/${customer.contact_id}`)}
                                                        >
                                                            <td>
                                                                {index === 0 && <span className="badge bg-warning text-dark">🥇</span>}
                                                                {index === 1 && <span className="badge bg-secondary">🥈</span>}
                                                                {index === 2 && <span className="badge bg-danger">🥉</span>}
                                                                {index > 2 && <span className="text-muted">{index + 1}</span>}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div
                                                                        className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                                                        style={{
                                                                            width: '36px',
                                                                            height: '36px',
                                                                            backgroundColor: `hsl(${customer.contact_id * 40}, 70%, 85%)`
                                                                        }}
                                                                    >
                                                                        <span className="fw-bold" style={{ color: `hsl(${customer.contact_id * 40}, 70%, 35%)` }}>
                                                                            {customer.name?.charAt(0)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="fw-medium">{customer.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="text-end fw-bold text-success">
                                                                {formatCurrency(customer.total_purchases)}
                                                            </td>
                                                            <td className="text-end">
                                                                <span className="badge bg-light text-dark">
                                                                    {customer.transaction_count || '-'} عملية
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                {customer.outstanding > 0 ? (
                                                                    <span className="badge bg-warning text-dark">
                                                                        مدين: {formatCurrency(customer.outstanding, true)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-success">مسدد</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i className="bi bi-people display-4 text-muted mb-3 d-block opacity-25"></i>
                                            <p className="text-muted">لا توجد بيانات عملاء</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'alerts':
                return (
                    <div className="row" key={id}>
                        <div className="col-12">
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-transparent border-0 py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                                            <i className="bi bi-bell-fill me-2 text-warning"></i>
                                            التنبيهات الذكية
                                            {alerts.length > 0 && (
                                                <span className="badge bg-danger ms-2">{alerts.length}</span>
                                            )}
                                        </h5>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        {alerts.length > 0 ? alerts.map((alert, index) => (
                                            <div key={index} className="col-md-6 col-lg-4">
                                                <div
                                                    className={`alert alert-${alert.type} d-flex align-items-start mb-0 h-100`}
                                                    style={{ borderRadius: '12px' }}
                                                >
                                                    <i className={`bi ${alert.icon} me-3 fs-4 mt-1`}></i>
                                                    <div>
                                                        <strong className="d-block mb-1">{alert.title}</strong>
                                                        <small className="opacity-75">{alert.message}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="col-12 text-center py-4">
                                                <i className="bi bi-check-circle display-4 text-success mb-3 d-block"></i>
                                                <p className="text-muted mb-0">لا توجد تنبيهات حالية - كل شيء على ما يرام!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'quick_actions':
                const actions = [
                    { label: 'بيع جديد', icon: 'bi-cart-plus', color: 'success', path: '/sales' },
                    { label: 'شراء جديد', icon: 'bi-bag-plus', color: 'primary', path: '/purchases' },
                    { label: 'الخزينة', icon: 'bi-safe2', color: 'warning', path: '/treasury' },
                    { label: 'مصروف جديد', icon: 'bi-receipt', color: 'danger', path: '/expenses' },
                    { label: 'تقرير الأرباح', icon: 'bi-graph-up', color: 'info', path: '/reports/income-statement' },
                    { label: 'جهات التعامل', icon: 'bi-people', color: 'secondary', path: '/contacts' },
                    { label: 'المخزون', icon: 'bi-box-seam', color: 'dark', path: '/inventory' },
                    { label: 'دفتر الأستاذ', icon: 'bi-journal-bookmark', color: 'purple', path: '/reports/general-ledger', customColor: '#6F42C1' }
                ];

                return (
                    <div className="row mt-2" key={id}>
                        <div className="col-12">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-transparent border-0 py-3">
                                    <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                                        <i className="bi bi-lightning-charge-fill me-2 text-primary"></i>
                                        إجراءات سريعة
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        {actions.map((action, index) => (
                                            <div key={index} className="col-6 col-md-3">
                                                <button
                                                    className={`btn w-100 py-3 d-flex flex-column align-items-center justify-content-center ${action.customColor ? '' : `btn-outline-${action.color}`}`}
                                                    style={action.customColor ? {
                                                        borderColor: action.customColor,
                                                        color: action.customColor,
                                                        borderWidth: '2px'
                                                    } : { borderWidth: '2px' }}
                                                    onClick={() => navigate(action.path)}
                                                >
                                                    <i className={`bi ${action.icon} fs-4 mb-1`}></i>
                                                    <span className="small">{action.label}</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
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
        <div className="container-fluid fade-in py-3">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h2 className="fw-bold mb-1" style={{ color: 'var(--primary-dark)' }}>
                                <i className="bi bi-speedometer2 me-2"></i>
                                {getGreeting()}، {user?.username || 'مستخدم'}
                            </h2>
                            <p className="text-muted mb-0">
                                نظرة عامة على أداء المزرعة
                                {lastUpdate && (
                                    <span className="ms-2 text-muted small">
                                        <i className="bi bi-clock me-1"></i>
                                        آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => { setTempLayout(layout); setShowConfigModal(true); }}
                            >
                                <i className="bi bi-gear-fill me-2"></i>تخصيص
                            </button>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                            >
                                <i className={`bi ${refreshing ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'} me-2`}></i>
                                {refreshing ? 'جاري...' : 'تحديث'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Widgets */}
            {layout.map(id => renderWidget(id))}

            {/* Config Modal */}
            {showConfigModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-gear me-2"></i>
                                    تخصيص لوحة التحكم
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowConfigModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted small mb-3">اختر العناصر التي تريد عرضها ورتبها حسب أولويتك.</p>
                                <ul className="list-group list-group-flush">
                                    {tempLayout.map((id, index) => {
                                        const widget = WIDGETS.find(w => w.id === id);
                                        return (
                                            <li key={id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                <div className="d-flex align-items-center">
                                                    <input
                                                        className="form-check-input me-3"
                                                        type="checkbox"
                                                        checked={true}
                                                        onChange={() => toggleWidget(id)}
                                                    />
                                                    <span>{widget?.label || id}</span>
                                                </div>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        disabled={index === 0}
                                                        onClick={() => moveWidget(index, 'up')}
                                                    >
                                                        <i className="bi bi-arrow-up"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        disabled={index === tempLayout.length - 1}
                                                        onClick={() => moveWidget(index, 'down')}
                                                    >
                                                        <i className="bi bi-arrow-down"></i>
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                    {WIDGETS.filter(w => !tempLayout.includes(w.id)).map(widget => (
                                        <li key={widget.id} className="list-group-item d-flex align-items-center px-0 bg-light">
                                            <input
                                                className="form-check-input me-3"
                                                type="checkbox"
                                                checked={false}
                                                onChange={() => toggleWidget(widget.id)}
                                            />
                                            <span className="text-muted">{widget.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>إلغاء</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveConfig}>
                                    <i className="bi bi-check-lg me-1"></i>
                                    حفظ التغييرات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add CSS for spin animation */}
            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .kpi-card-enhanced:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
                }
            `}</style>
        </div>
    );
}

export default Dashboard;
