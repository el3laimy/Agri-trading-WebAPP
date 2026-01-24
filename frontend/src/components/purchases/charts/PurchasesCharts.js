/**
 * PurchasesCharts.js
 * ApexCharts components for Purchases Management page
 */

import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '../../../context/ThemeContext';

/**
 * PurchasesTrendChart - خط بياني لاتجاه المشتريات
 */
export function PurchasesTrendChart({ purchases = [] }) {
    const { theme } = useTheme();

    const chartData = useMemo(() => {
        const dailyData = {};

        purchases.forEach(purchase => {
            const date = purchase.purchase_date?.split('T')[0];
            if (date) {
                if (!dailyData[date]) {
                    dailyData[date] = { total: 0, count: 0 };
                }
                dailyData[date].total += parseFloat(purchase.total_cost) || 0;
                dailyData[date].count += 1;
            }
        });

        const sortedDates = Object.keys(dailyData).sort();
        const last14Days = sortedDates.slice(-14);

        return {
            labels: last14Days.map(d => new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })),
            values: last14Days.map(d => dailyData[d]?.total || 0),
            counts: last14Days.map(d => dailyData[d]?.count || 0)
        };
    }, [purchases]);

    const options = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            fontFamily: 'Cairo, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        colors: ['#3b82f6'],
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05,
                stops: [0, 90, 100]
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartData.labels,
            labels: {
                style: {
                    colors: theme === 'dark' ? '#94a3b8' : '#64748b',
                    fontFamily: 'Cairo'
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: {
                    colors: theme === 'dark' ? '#94a3b8' : '#64748b',
                    fontFamily: 'Cairo'
                },
                formatter: (val) => {
                    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                    return val;
                }
            }
        },
        grid: {
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            strokeDashArray: 4
        },
        tooltip: {
            theme: theme,
            y: {
                formatter: (val) => val.toLocaleString('ar-EG') + ' ج.م'
            }
        }
    };

    const series = [{
        name: 'المشتريات',
        data: chartData.values
    }];

    if (purchases.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="text-center">
                    <i className="bi bi-graph-up text-3xl mb-2 block opacity-50" />
                    <p className="text-sm">لا توجد بيانات كافية للرسم البياني</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-48">
            <Chart options={options} series={series} type="area" height="100%" />
        </div>
    );
}

/**
 * PurchasesByStatusChart - دائري لحالة الدفع
 */
export function PurchasesByStatusChart({ purchases = [] }) {
    const { theme } = useTheme();

    const statusData = useMemo(() => {
        const counts = { PAID: 0, PARTIAL: 0, PENDING: 0 };
        const amounts = { PAID: 0, PARTIAL: 0, PENDING: 0 };

        purchases.forEach(purchase => {
            const status = purchase.payment_status || 'PENDING';
            counts[status] = (counts[status] || 0) + 1;
            amounts[status] = (amounts[status] || 0) + (parseFloat(purchase.total_cost) || 0);
        });

        return { counts, amounts };
    }, [purchases]);

    const options = {
        chart: {
            type: 'donut',
            fontFamily: 'Cairo, sans-serif'
        },
        colors: ['#10b981', '#f59e0b', '#ef4444'],
        labels: ['مدفوع', 'جزئي', 'معلق'],
        stroke: { width: 0 },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '14px',
                            fontFamily: 'Cairo',
                            color: theme === 'dark' ? '#f8fafc' : '#1e293b'
                        },
                        value: {
                            show: true,
                            fontSize: '20px',
                            fontFamily: 'Cairo',
                            fontWeight: 700,
                            color: theme === 'dark' ? '#3b82f6' : '#2563eb'
                        },
                        total: {
                            show: true,
                            label: 'الإجمالي',
                            fontSize: '12px',
                            fontFamily: 'Cairo',
                            color: theme === 'dark' ? '#94a3b8' : '#64748b',
                            formatter: () => purchases.length + ' عملية'
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: {
            position: 'bottom',
            fontFamily: 'Cairo',
            fontSize: '12px',
            labels: {
                colors: theme === 'dark' ? '#94a3b8' : '#64748b'
            }
        },
        tooltip: {
            theme: theme,
            y: {
                formatter: (val, { seriesIndex }) => {
                    const labels = ['PAID', 'PARTIAL', 'PENDING'];
                    return statusData.amounts[labels[seriesIndex]]?.toLocaleString('ar-EG') + ' ج.م';
                }
            }
        }
    };

    const series = [
        statusData.counts.PAID || 0,
        statusData.counts.PARTIAL || 0,
        statusData.counts.PENDING || 0
    ];

    if (purchases.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="text-center">
                    <i className="bi bi-pie-chart text-3xl mb-2 block opacity-50" />
                    <p className="text-sm">لا توجد بيانات</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-48">
            <Chart options={options} series={series} type="donut" height="100%" />
        </div>
    );
}

/**
 * TopSuppliersChart - أفضل الموردين
 */
export function TopSuppliersChart({ purchases = [] }) {
    const { theme } = useTheme();

    const supplierData = useMemo(() => {
        const suppliers = {};

        purchases.forEach(purchase => {
            const supplierName = purchase.supplier?.name || 'غير محدد';
            if (!suppliers[supplierName]) {
                suppliers[supplierName] = { total: 0, count: 0 };
            }
            suppliers[supplierName].total += parseFloat(purchase.total_cost) || 0;
            suppliers[supplierName].count += 1;
        });

        return Object.entries(suppliers)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);
    }, [purchases]);

    const options = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            fontFamily: 'Cairo, sans-serif'
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 6,
                barHeight: '60%',
                distributed: true
            }
        },
        colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'],
        dataLabels: {
            enabled: true,
            formatter: (val) => {
                if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
                return val;
            },
            style: {
                fontSize: '11px',
                fontFamily: 'Cairo',
                fontWeight: 600
            }
        },
        xaxis: {
            categories: supplierData.map(([name]) => name),
            labels: {
                style: {
                    colors: theme === 'dark' ? '#94a3b8' : '#64748b',
                    fontFamily: 'Cairo'
                },
                formatter: (val) => {
                    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                    return val;
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: theme === 'dark' ? '#94a3b8' : '#64748b',
                    fontFamily: 'Cairo',
                    fontSize: '12px'
                }
            }
        },
        grid: {
            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } }
        },
        legend: { show: false },
        tooltip: {
            theme: theme,
            y: {
                formatter: (val) => val.toLocaleString('ar-EG') + ' ج.م'
            }
        }
    };

    const series = [{
        name: 'المشتريات',
        data: supplierData.map(([, data]) => data.total)
    }];

    if (supplierData.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="text-center">
                    <i className="bi bi-bar-chart text-3xl mb-2 block opacity-50" />
                    <p className="text-sm">لا توجد بيانات</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-48">
            <Chart options={options} series={series} type="bar" height="100%" />
        </div>
    );
}

/**
 * PurchasesStatsCards - بطاقات إحصائيات المشتريات
 */
export function PurchasesStatsCards({ purchases = [] }) {
    const stats = useMemo(() => {
        const totalExpense = purchases.reduce((sum, p) => sum + (parseFloat(p.total_cost) || 0), 0);
        const totalPaid = purchases.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
        const totalPending = totalExpense - totalPaid;
        const totalQuantity = purchases.reduce((sum, p) => sum + (parseFloat(p.quantity_kg) || 0), 0);

        return {
            totalExpense,
            totalPaid,
            totalPending,
            totalQuantity,
            purchasesCount: purchases.length,
            paidCount: purchases.filter(p => p.payment_status === 'PAID').length,
            pendingCount: purchases.filter(p => p.payment_status === 'PENDING').length
        };
    }, [purchases]);

    const formatCurrency = (val) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + ' م';
        if (val >= 1000) return (val / 1000).toFixed(0) + ' ك';
        return val.toLocaleString('ar-EG');
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* إجمالي المشتريات */}
            <div className="glass-premium px-4 py-3 rounded-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <i className="bi bi-bag-check text-lg" />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">المشتريات</p>
                        <p className="text-lg font-bold">{formatCurrency(stats.totalExpense)}</p>
                    </div>
                </div>
            </div>

            {/* المدفوع */}
            <div className="glass-premium px-4 py-3 rounded-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                        <i className="bi bi-check-circle text-lg text-green-300" />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">المدفوع</p>
                        <p className="text-lg font-bold">{formatCurrency(stats.totalPaid)}</p>
                    </div>
                </div>
            </div>

            {/* المستحق */}
            <div className="glass-premium px-4 py-3 rounded-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center">
                        <i className="bi bi-exclamation-circle text-lg text-red-300" />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">المستحق</p>
                        <p className="text-lg font-bold">{formatCurrency(stats.totalPending)}</p>
                    </div>
                </div>
            </div>

            {/* عدد العمليات */}
            <div className="glass-premium px-4 py-3 rounded-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center">
                        <i className="bi bi-receipt text-lg text-amber-300" />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">العمليات</p>
                        <p className="text-lg font-bold">{stats.purchasesCount}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PurchasesTrendChart;
