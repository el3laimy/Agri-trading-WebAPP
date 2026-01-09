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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {error}
                </div>
            </div>
        );
    }

    if (!report) return null;

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
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <i className="bi bi-pie-chart-fill text-emerald-600"></i>
                    توزيع رأس المال
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    تاريخ التقرير: {formatDate(report.report_date)}
                </p>
            </div>

            {/* Balance Check Alert */}
            {!report.is_balanced && (
                <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <i className="bi bi-exclamation-triangle-fill text-2xl"></i>
                    <div>
                        <strong>تنبيه!</strong> يوجد فرق في التوازن بمقدار {formatCurrency(report.difference)}
                        <br />
                        <small>يرجى مراجعة القيود المحاسبية</small>
                    </div>
                </div>
            )}

            {/* Main Equation Card */}
            <div className="rounded-xl shadow-sm mb-6 text-white text-center py-6" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 100%)' }}>
                <h5 className="mb-4 text-lg">معادلة التوازن المحاسبي</h5>
                <div className="flex justify-center items-center flex-wrap gap-2 px-4">
                    <span className="bg-white/90 text-gray-800 text-sm px-4 py-2 rounded-lg font-medium">
                        رأس المال<br />{formatCurrency(report.owner_capital)}
                    </span>
                    <span className="text-3xl">+</span>
                    <span className="bg-white/90 text-gray-800 text-sm px-4 py-2 rounded-lg font-medium">
                        الأرباح<br />{formatCurrency(report.net_profit)}
                    </span>
                    <span className="text-3xl">+</span>
                    <span className="bg-white/90 text-gray-800 text-sm px-4 py-2 rounded-lg font-medium">
                        ديون علينا<br />{formatCurrency(report.accounts_payable)}
                    </span>
                    <span className="text-3xl">=</span>
                    <span className="bg-white/90 text-gray-800 text-sm px-4 py-2 rounded-lg font-medium">
                        النقدية<br />{formatCurrency(report.cash_in_hand)}
                    </span>
                    <span className="text-3xl">+</span>
                    <span className="bg-white/90 text-gray-800 text-sm px-4 py-2 rounded-lg font-medium">
                        المخزون<br />{formatCurrency(report.inventory_value)}
                    </span>
                    <span className="text-3xl">+</span>
                    <span className="bg-white/90 text-gray-800 text-sm px-4 py-2 rounded-lg font-medium">
                        ديون لنا<br />{formatCurrency(report.accounts_receivable)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Assets (Right Side) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-green-600 text-white px-5 py-4">
                        <h5 className="font-bold flex items-center gap-2">
                            <i className="bi bi-arrow-left-circle"></i>
                            استخدامات التمويل (الأصول)
                        </h5>
                    </div>
                    <div className="p-5">
                        {/* Chart */}
                        {chartData && (
                            <div style={{ height: '250px', marginBottom: '20px' }}>
                                <Doughnut data={chartData} options={chartOptions} />
                            </div>
                        )}

                        {/* Details */}
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            <div className="flex justify-between items-center py-3">
                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <i className="bi bi-cash-stack text-green-600"></i>
                                    النقدية
                                </span>
                                <strong className="text-green-600 dark:text-green-400">{formatCurrency(report.cash_in_hand)}</strong>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <i className="bi bi-box-seam text-amber-500"></i>
                                    قيمة المخزون
                                </span>
                                <strong className="text-amber-500 dark:text-amber-400">{formatCurrency(report.inventory_value)}</strong>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <i className="bi bi-people text-cyan-600"></i>
                                    ديون العملاء (لنا)
                                </span>
                                <strong className="text-cyan-600 dark:text-cyan-400">{formatCurrency(report.accounts_receivable)}</strong>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-green-50 dark:bg-green-900/20 rounded-lg px-2 -mx-2">
                                <strong className="text-gray-800 dark:text-gray-200">إجمالي الأصول</strong>
                                <strong className="text-xl text-green-600 dark:text-green-400">{formatCurrency(report.total_assets)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sources (Left Side) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-emerald-600 text-white px-5 py-4">
                        <h5 className="font-bold flex items-center gap-2">
                            <i className="bi bi-arrow-right-circle"></i>
                            مصادر التمويل
                        </h5>
                    </div>
                    <div className="p-5">
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                            <div className="flex justify-between items-center py-4">
                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <i className="bi bi-bank text-emerald-600"></i>
                                    رأس المال الأصلي
                                </span>
                                <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(report.owner_capital)}</strong>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <i className="bi bi-graph-up-arrow text-green-600"></i>
                                    صافي الربح
                                </span>
                                <strong className={report.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
                                    {formatCurrency(report.net_profit)}
                                </strong>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <i className="bi bi-truck text-red-500"></i>
                                    ديون الموردين (علينا)
                                </span>
                                <strong className="text-red-500 dark:text-red-400">{formatCurrency(report.accounts_payable)}</strong>
                            </div>
                            <div className="flex justify-between items-center py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-2 -mx-2">
                                <strong className="text-gray-800 dark:text-gray-200">إجمالي مصادر التمويل</strong>
                                <strong className="text-xl text-emerald-600 dark:text-emerald-400">{formatCurrency(report.total_liabilities_and_equity)}</strong>
                            </div>
                        </div>

                        {/* Balance Status */}
                        <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${report.is_balanced ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
                            <i className={`bi ${report.is_balanced ? 'bi-check-circle-fill text-green-600 dark:text-green-400' : 'bi-exclamation-triangle-fill text-amber-600 dark:text-amber-400'} text-2xl`}></i>
                            <div className={report.is_balanced ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}>
                                <strong>{report.is_balanced ? 'متوازن ✓' : 'غير متوازن!'}</strong>
                                {!report.is_balanced && (
                                    <span className="block text-sm">
                                        الفرق: {formatCurrency(report.difference)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-r-4 border-green-500 text-center py-6 px-4">
                    <i className="bi bi-cash-coin text-5xl text-green-600 dark:text-green-400 mb-3 block"></i>
                    <h6 className="text-gray-500 dark:text-gray-400 mb-2">السيولة النقدية</h6>
                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(report.cash_in_hand)}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-r-4 border-amber-500 text-center py-6 px-4">
                    <i className="bi bi-box-seam text-5xl text-amber-500 dark:text-amber-400 mb-3 block"></i>
                    <h6 className="text-gray-500 dark:text-gray-400 mb-2">قيمة البضاعة</h6>
                    <h3 className="text-2xl font-bold text-amber-500 dark:text-amber-400">{formatCurrency(report.inventory_value)}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-r-4 border-cyan-500 text-center py-6 px-4">
                    <i className="bi bi-graph-up text-5xl text-cyan-600 dark:text-cyan-400 mb-3 block"></i>
                    <h6 className="text-gray-500 dark:text-gray-400 mb-2">صافي الربح</h6>
                    <h3 className={`text-2xl font-bold ${report.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        {formatCurrency(report.net_profit)}
                    </h3>
                </div>
            </div>
        </div>
    );
}

export default CapitalDistribution;
