import React, { useState, useEffect } from 'react';
import { getDashboardKpis, getDashboardAlerts, getSalesByCrop } from '../api/reports';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
    const [kpis, setKpis] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [salesByCrop, setSalesByCrop] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [kpisData, alertsData, salesData] = await Promise.all([
                getDashboardKpis(),
                getDashboardAlerts().catch(() => []),
                getSalesByCrop().catch(() => [])
            ]);
            setKpis(kpisData);
            setAlerts(alertsData);
            setSalesByCrop(salesData);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading || !kpis) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    // KPI Card Component
    const KpiCard = ({ title, value, icon, color, formatAsCurrency = true, onClick, subtitle }) => (
        <div className="col-md-6 col-lg-3 mb-4">
            <div
                className="card border-0 shadow-sm h-100"
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
                                {formatAsCurrency ? formatCurrency(value) : value}
                            </h4>
                            {subtitle && <small className="text-muted">{subtitle}</small>}
                        </div>
                        <div className="p-2 rounded" style={{ backgroundColor: `${color}20` }}>
                            <i className={`bi ${icon} fs-4`} style={{ color }}></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Chart configurations
    const chartColors = ['#1E5631', '#C4A35A', '#3D8B4F', '#8D6E63', '#4CAF50', '#FDD835'];

    const salesByCropChartData = {
        labels: salesByCrop.map(s => s.crop),
        datasets: [{
            data: salesByCrop.map(s => s.total),
            backgroundColor: chartColors,
            borderWidth: 0
        }]
    };

    const revenueExpenseData = {
        labels: ['الإيرادات', 'تكلفة المبيعات', 'المصروفات', 'صافي الربح'],
        datasets: [{
            label: 'المبالغ (ج.م)',
            data: [
                kpis.total_revenue,
                kpis.total_revenue - kpis.gross_profit,
                kpis.total_expenses,
                kpis.net_profit
            ],
            backgroundColor: ['#1E5631', '#DC3545', '#FFC107', '#28A745'],
            borderRadius: 8,
            borderWidth: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { family: 'Cairo, sans-serif', size: 11 },
                    padding: 15,
                    usePointStyle: true
                }
            }
        }
    };

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12 d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>
                            <i className="bi bi-speedometer2 me-2"></i>
                            لوحة التحكم
                        </h2>
                        <p className="text-muted mb-0">نظرة عامة على أداء المزرعة</p>
                    </div>
                    <button className="btn btn-outline-primary" onClick={fetchData}>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        تحديث
                    </button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="row mb-2">
                <div className="col-12">
                    <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 100%)' }}>
                        <div className="card-body text-white">
                            <div className="row text-center">
                                <div className="col-md-3 border-end border-white-50">
                                    <small className="text-white-50">مبيعات اليوم</small>
                                    <h4 className="fw-bold mb-0">{formatCurrency(kpis.today_sales)}</h4>
                                </div>
                                <div className="col-md-3 border-end border-white-50">
                                    <small className="text-white-50">تحصيلات اليوم</small>
                                    <h4 className="fw-bold mb-0">{formatCurrency(kpis.today_collections)}</h4>
                                </div>
                                <div className="col-md-3 border-end border-white-50">
                                    <small className="text-white-50">رصيد الخزينة</small>
                                    <h4 className="fw-bold mb-0">{formatCurrency(kpis.cash_balance)}</h4>
                                </div>
                                <div className="col-md-3">
                                    <small className="text-white-50">هامش الربح</small>
                                    <h4 className="fw-bold mb-0">{kpis.gross_margin}%</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="row">
                <KpiCard
                    title="إجمالي الإيرادات"
                    value={kpis.total_revenue}
                    icon="bi-cash-stack"
                    color="#1E5631"
                    onClick={() => navigate('/sales')}
                />
                <KpiCard
                    title="صافي الربح"
                    value={kpis.net_profit}
                    icon="bi-graph-up-arrow"
                    color="#28A745"
                    onClick={() => navigate('/reports/income-statement')}
                />
                <KpiCard
                    title="قيمة المخزون"
                    value={kpis.inventory_value}
                    icon="bi-box-seam"
                    color="#C4A35A"
                    subtitle={`${kpis.total_stock_kg?.toLocaleString('ar-EG')} كجم`}
                    onClick={() => navigate('/inventory')}
                />
                <KpiCard
                    title="رصيد الخزينة"
                    value={kpis.cash_balance}
                    icon="bi-wallet2"
                    color="#17A2B8"
                    onClick={() => navigate('/treasury')}
                />
            </div>

            {/* Secondary KPIs */}
            <div className="row">
                <KpiCard
                    title="ديون العملاء"
                    value={kpis.total_receivables}
                    icon="bi-person-check"
                    color="#FFC107"
                    onClick={() => navigate('/contacts')}
                />
                <KpiCard
                    title="ديون الموردين"
                    value={kpis.total_payables}
                    icon="bi-truck"
                    color="#DC3545"
                    onClick={() => navigate('/contacts')}
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

            {/* Charts Row */}
            <div className="row mt-2">
                {/* Revenue/Expense Bar */}
                <div className="col-lg-7 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 py-3">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
                                ملخص الأداء المالي
                            </h5>
                        </div>
                        <div className="card-body">
                            <div style={{ height: '280px' }}>
                                <Bar data={revenueExpenseData} options={{
                                    ...chartOptions,
                                    indexAxis: 'y',
                                    scales: {
                                        x: {
                                            beginAtZero: true,
                                            ticks: { font: { family: 'Cairo' } }
                                        },
                                        y: {
                                            ticks: { font: { family: 'Cairo' } }
                                        }
                                    }
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales by Crop */}
                <div className="col-lg-5 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 py-3">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-pie-chart-fill me-2 text-success"></i>
                                المبيعات حسب المحصول
                            </h5>
                        </div>
                        <div className="card-body">
                            {salesByCrop.length > 0 ? (
                                <div style={{ height: '280px' }}>
                                    <Doughnut data={salesByCropChartData} options={{
                                        ...chartOptions,
                                        cutout: '60%'
                                    }} />
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                    لا توجد بيانات مبيعات بعد
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 py-3">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-bell-fill me-2 text-warning"></i>
                                التنبيهات الذكية
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {alerts.map((alert, index) => (
                                    <div key={index} className="col-md-6 col-lg-4 mb-3">
                                        <div className={`alert alert-${alert.type} d-flex align-items-center mb-0 h-100`}>
                                            <i className={`bi ${alert.icon} me-3 fs-4`}></i>
                                            <div>
                                                <strong className="d-block">{alert.title}</strong>
                                                <small>{alert.message}</small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 py-3">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-lightning-charge-fill me-2 text-primary"></i>
                                إجراءات سريعة
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex flex-wrap gap-2">
                                <button className="btn btn-success" onClick={() => navigate('/sales')}>
                                    <i className="bi bi-plus-circle me-2"></i>
                                    بيع جديد
                                </button>
                                <button className="btn btn-primary" onClick={() => navigate('/purchases')}>
                                    <i className="bi bi-plus-circle me-2"></i>
                                    شراء جديد
                                </button>
                                <button className="btn btn-warning" onClick={() => navigate('/treasury')}>
                                    <i className="bi bi-wallet me-2"></i>
                                    الخزينة
                                </button>
                                <button className="btn btn-info text-white" onClick={() => navigate('/reports/capital-distribution')}>
                                    <i className="bi bi-pie-chart me-2"></i>
                                    توزيع رأس المال
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/contacts')}>
                                    <i className="bi bi-people me-2"></i>
                                    جهات التعامل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
