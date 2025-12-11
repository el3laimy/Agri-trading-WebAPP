import React, { useState, useEffect } from 'react';
import { getCapitalDistribution, getCapitalBreakdown } from '../api/reports';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function CapitalDistribution() {
    const [report, setReport] = useState(null);
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [reportData, breakdownData] = await Promise.all([
                getCapitalDistribution(),
                getCapitalBreakdown()
            ]);
            setReport(reportData);
            setBreakdown(breakdownData);
        } catch (err) {
            setError("فشل تحميل تقرير توزيع رأس المال");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            </div>
        );
    }

    if (!report) return null;

    // Chart data
    const chartData = breakdown ? {
        labels: breakdown.categories.map(c => c.name),
        datasets: [{
            data: breakdown.categories.map(c => c.value),
            backgroundColor: breakdown.categories.map(c => c.color),
            borderColor: breakdown.categories.map(c => c.color),
            borderWidth: 2,
            hoverOffset: 10
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { family: 'Cairo, sans-serif', size: 14 },
                    padding: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = formatCurrency(context.raw);
                        const percentage = breakdown.categories[context.dataIndex].percentage;
                        return `${context.label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '60%'
    };

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-pie-chart-fill me-2"></i>
                        توزيع رأس المال
                    </h2>
                    <p className="text-muted">
                        تاريخ التقرير: {formatDate(report.report_date)}
                    </p>
                </div>
            </div>

            {/* Balance Check Alert */}
            {!report.is_balanced && (
                <div className="alert alert-warning d-flex align-items-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
                    <div>
                        <strong>تنبيه!</strong> يوجد فرق في التوازن بمقدار {formatCurrency(report.difference)}
                        <br />
                        <small>يرجى مراجعة القيود المحاسبية</small>
                    </div>
                </div>
            )}

            {/* Main Equation Card */}
            <div className="card border-0 shadow-sm mb-4 bg-gradient" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 100%)' }}>
                <div className="card-body text-white text-center py-4">
                    <h5 className="mb-3">معادلة التوازن المحاسبي</h5>
                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-2">
                        <span className="badge bg-light text-dark fs-6 px-3 py-2">
                            رأس المال<br />{formatCurrency(report.owner_capital)}
                        </span>
                        <span className="fs-3">+</span>
                        <span className="badge bg-light text-dark fs-6 px-3 py-2">
                            الأرباح<br />{formatCurrency(report.net_profit)}
                        </span>
                        <span className="fs-3">+</span>
                        <span className="badge bg-light text-dark fs-6 px-3 py-2">
                            ديون علينا<br />{formatCurrency(report.accounts_payable)}
                        </span>
                        <span className="fs-3">=</span>
                        <span className="badge bg-light text-dark fs-6 px-3 py-2">
                            النقدية<br />{formatCurrency(report.cash_in_hand)}
                        </span>
                        <span className="fs-3">+</span>
                        <span className="badge bg-light text-dark fs-6 px-3 py-2">
                            المخزون<br />{formatCurrency(report.inventory_value)}
                        </span>
                        <span className="fs-3">+</span>
                        <span className="badge bg-light text-dark fs-6 px-3 py-2">
                            ديون لنا<br />{formatCurrency(report.accounts_receivable)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Assets (Right Side) */}
                <div className="col-md-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-arrow-left-circle me-2"></i>
                                استخدامات التمويل (الأصول)
                            </h5>
                        </div>
                        <div className="card-body">
                            {/* Chart */}
                            {chartData && (
                                <div style={{ height: '250px', marginBottom: '20px' }}>
                                    <Doughnut data={chartData} options={chartOptions} />
                                </div>
                            )}

                            {/* Details */}
                            <div className="list-group list-group-flush">
                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>
                                        <i className="bi bi-cash-stack text-success me-2"></i>
                                        النقدية
                                    </span>
                                    <strong className="text-success">{formatCurrency(report.cash_in_hand)}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>
                                        <i className="bi bi-box-seam text-warning me-2"></i>
                                        قيمة المخزون
                                    </span>
                                    <strong className="text-warning">{formatCurrency(report.inventory_value)}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>
                                        <i className="bi bi-people text-info me-2"></i>
                                        ديون العملاء (لنا)
                                    </span>
                                    <strong className="text-info">{formatCurrency(report.accounts_receivable)}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center bg-success-subtle">
                                    <strong>إجمالي الأصول</strong>
                                    <strong className="fs-5 text-success">{formatCurrency(report.total_assets)}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sources (Left Side) */}
                <div className="col-md-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-arrow-right-circle me-2"></i>
                                مصادر التمويل
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="list-group list-group-flush">
                                <div className="list-group-item d-flex justify-content-between align-items-center py-3">
                                    <span>
                                        <i className="bi bi-bank text-primary me-2"></i>
                                        رأس المال الأصلي
                                    </span>
                                    <strong className="text-primary">{formatCurrency(report.owner_capital)}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center py-3">
                                    <span>
                                        <i className="bi bi-graph-up-arrow text-success me-2"></i>
                                        صافي الربح
                                    </span>
                                    <strong className={report.net_profit >= 0 ? 'text-success' : 'text-danger'}>
                                        {formatCurrency(report.net_profit)}
                                    </strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center py-3">
                                    <span>
                                        <i className="bi bi-truck text-danger me-2"></i>
                                        ديون الموردين (علينا)
                                    </span>
                                    <strong className="text-danger">{formatCurrency(report.accounts_payable)}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between align-items-center bg-primary-subtle py-3">
                                    <strong>إجمالي مصادر التمويل</strong>
                                    <strong className="fs-5 text-primary">{formatCurrency(report.total_liabilities_and_equity)}</strong>
                                </div>
                            </div>

                            {/* Balance Status */}
                            <div className={`alert ${report.is_balanced ? 'alert-success' : 'alert-warning'} mt-4 mb-0 d-flex align-items-center`}>
                                <i className={`bi ${report.is_balanced ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-4`}></i>
                                <div>
                                    <strong>{report.is_balanced ? 'متوازن ✓' : 'غير متوازن!'}</strong>
                                    {!report.is_balanced && (
                                        <span className="d-block small">
                                            الفرق: {formatCurrency(report.difference)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row">
                <div className="col-md-4 mb-3">
                    <div className="card border-0 shadow-sm text-center py-4" style={{ borderRight: '4px solid #28A745' }}>
                        <div className="card-body">
                            <i className="bi bi-cash-coin fs-1 text-success mb-2"></i>
                            <h6 className="text-muted">السيولة النقدية</h6>
                            <h3 className="fw-bold text-success">{formatCurrency(report.cash_in_hand)}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card border-0 shadow-sm text-center py-4" style={{ borderRight: '4px solid #FFC107' }}>
                        <div className="card-body">
                            <i className="bi bi-box-seam fs-1 text-warning mb-2"></i>
                            <h6 className="text-muted">قيمة البضاعة</h6>
                            <h3 className="fw-bold text-warning">{formatCurrency(report.inventory_value)}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card border-0 shadow-sm text-center py-4" style={{ borderRight: '4px solid #17A2B8' }}>
                        <div className="card-body">
                            <i className="bi bi-graph-up fs-1 text-info mb-2"></i>
                            <h6 className="text-muted">صافي الربح</h6>
                            <h3 className={`fw-bold ${report.net_profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                {formatCurrency(report.net_profit)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CapitalDistribution;
