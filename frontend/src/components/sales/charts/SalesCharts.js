/**
 * SalesCharts.js
 * ApexCharts components for Sales Management page
 */

import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '../../../context/ThemeContext';

/**
 * SalesTrendChart - خط بياني لاتجاه المبيعات
 */
export function SalesTrendChart({ sales = [] }) {
    const { theme } = useTheme();

    // Process data - group by date
    const chartData = useMemo(() => {
        const dailyData = {};

        sales.forEach(sale => {
            const date = sale.sale_date?.split('T')[0];
            if (date) {
                if (!dailyData[date]) {
                    dailyData[date] = { total: 0, count: 0 };
                }
                dailyData[date].total += parseFloat(sale.total_sale_amount) || 0;
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
    }, [sales]);

    const options = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            fontFamily: 'Cairo, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            },
            sparkline: { enabled: false }
        },
        colors: ['#10b981'],
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
        name: 'المبيعات',
        data: chartData.values
    }];

    if (sales.length === 0) {
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
 * SalesByStatusChart - دائري لحالة الدفع
 */
export function SalesByStatusChart({ sales = [] }) {
    const { theme } = useTheme();

    const statusData = useMemo(() => {
        const counts = { PAID: 0, PARTIAL: 0, PENDING: 0 };
        const amounts = { PAID: 0, PARTIAL: 0, PENDING: 0 };

        sales.forEach(sale => {
            const status = sale.payment_status || 'PENDING';
            counts[status] = (counts[status] || 0) + 1;
            amounts[status] = (amounts[status] || 0) + (parseFloat(sale.total_sale_amount) || 0);
        });

        return { counts, amounts };
    }, [sales]);

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
                            color: theme === 'dark' ? '#10b981' : '#059669'
                        },
                        total: {
                            show: true,
                            label: 'الإجمالي',
                            fontSize: '12px',
                            fontFamily: 'Cairo',
                            color: theme === 'dark' ? '#94a3b8' : '#64748b',
                            formatter: () => sales.length + ' عملية'
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

    if (sales.length === 0) {
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
 * TopCropsChart - أفضل المحاصيل مبيعاً
 */
export function TopCropsChart({ sales = [] }) {
    const { theme } = useTheme();

    const cropData = useMemo(() => {
        const crops = {};

        sales.forEach(sale => {
            const cropName = sale.crop?.crop_name || 'غير محدد';
            if (!crops[cropName]) {
                crops[cropName] = { total: 0, count: 0 };
            }
            crops[cropName].total += parseFloat(sale.total_sale_amount) || 0;
            crops[cropName].count += 1;
        });

        return Object.entries(crops)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);
    }, [sales]);

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
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
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
            categories: cropData.map(([name]) => name),
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
        name: 'المبيعات',
        data: cropData.map(([, data]) => data.total)
    }];

    if (cropData.length === 0) {
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
 * SalesStatsCards - بطاقات إحصائيات المبيعات
 */
export function SalesStatsCards({ sales = [] }) {
    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total_sale_amount) || 0), 0);
        const totalPaid = sales.reduce((sum, s) => sum + (parseFloat(s.amount_received) || 0), 0);
        const totalPending = totalRevenue - totalPaid;
        const totalQuantity = sales.reduce((sum, s) => sum + (parseFloat(s.quantity_sold_kg) || 0), 0);

        return {
            totalRevenue,
            totalPaid,
            totalPending,
            totalQuantity,
            salesCount: sales.length,
            paidCount: sales.filter(s => s.payment_status === 'PAID').length,
            pendingCount: sales.filter(s => s.payment_status === 'PENDING').length
        };
    }, [sales]);

    const formatCurrency = (val) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + ' م';
        if (val >= 1000) return (val / 1000).toFixed(0) + ' ك';
        return val.toLocaleString('ar-EG');
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* إجمالي الإيرادات */}
            <div className="glass-premium px-4 py-3 rounded-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <i className="bi bi-cash-stack text-lg" />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">الإيرادات</p>
                        <p className="text-lg font-bold">{formatCurrency(stats.totalRevenue)}</p>
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

            {/* المعلق */}
            <div className="glass-premium px-4 py-3 rounded-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center">
                        <i className="bi bi-clock-history text-lg text-amber-300" />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">المعلق</p>
                        <p className="text-lg font-bold">{formatCurrency(stats.totalPending)}</p>
                    </div>
                </div>
            </div>

            {/* عدد العمليات */}
            <div className="glass-premium px-4 py-3 rounded-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                        <i className="bi bi-receipt text-lg text-blue-300" />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">العمليات</p>
                        <p className="text-lg font-bold">{stats.salesCount}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SalesTrendChart;
