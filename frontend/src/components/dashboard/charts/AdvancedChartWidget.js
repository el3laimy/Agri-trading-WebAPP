import React, { useState, useEffect, useRef } from 'react';
import Chart from 'react-apexcharts';
import { getAdvancedChartData } from '../../../api/reports';
import { format, subDays, startOfYear, subYears } from 'date-fns';

// Constants
const PERIODS = [
    { id: 'week', label: '7 أيام', icon: 'bi-calendar-week' },
    { id: 'month', label: '30 يوم', icon: 'bi-calendar-month' },
    { id: 'year', label: 'سنة', icon: 'bi-calendar3' },
];

const AdvancedChartWidget = () => {
    // --- State ---
    const [period, setPeriod] = useState('week');
    const [comparisonEnabled, setComparisonEnabled] = useState(false);
    const [expensesEnabled, setExpensesEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    // --- Helpers ---
    const getDateRange = (selectedPeriod) => {
        const today = new Date();
        let start, end = today;
        let compStart, compEnd;

        if (selectedPeriod === 'week') {
            start = subDays(today, 6);
            compEnd = subDays(start, 1);
            compStart = subDays(compEnd, 6);
        } else if (selectedPeriod === 'month') {
            start = subDays(today, 29);
            compEnd = subDays(start, 1);
            compStart = subDays(compEnd, 29);
        } else if (selectedPeriod === 'year') {
            start = startOfYear(today);
            end = today;
            compStart = startOfYear(subYears(today, 1));
            compEnd = subYears(today, 1);
        }

        return { start, end, compStart, compEnd };
    };

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const { start, end, compStart, compEnd } = getDateRange(period);

            const params = {
                start_date: format(start, 'yyyy-MM-dd'),
                end_date: format(end, 'yyyy-MM-dd'),
                include_expenses: expensesEnabled,
            };

            if (comparisonEnabled) {
                params.compare_start_date = format(compStart, 'yyyy-MM-dd');
                params.compare_end_date = format(compEnd, 'yyyy-MM-dd');
            }

            const result = await getAdvancedChartData(params);
            setData(result);
        } catch (error) {
            console.error("Error fetching chart data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period, comparisonEnabled, expensesEnabled]);

    // --- ApexCharts Configuration ---
    const chartOptions = {
        chart: {
            type: 'area',
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            },
            fontFamily: 'Cairo, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 1000,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 500
                }
            },
            dropShadow: {
                enabled: true,
                color: '#10b981',
                top: 10,
                left: 0,
                blur: 8,
                opacity: 0.2
            }
        },
        colors: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
        stroke: {
            curve: 'smooth',
            width: [3, 3, 2, 2],
            dashArray: [0, 0, 5, 5]
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
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: data?.labels || [],
            labels: {
                style: {
                    colors: '#9ca3af',
                    fontFamily: 'Cairo'
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#9ca3af',
                    fontFamily: 'Cairo'
                },
                formatter: (value) => {
                    if (value >= 1000000) {
                        return (value / 1000000).toFixed(1) + ' م';
                    } else if (value >= 1000) {
                        return (value / 1000).toFixed(0) + ' ك';
                    }
                    return value;
                }
            }
        },
        grid: {
            borderColor: 'rgba(156, 163, 175, 0.1)',
            strokeDashArray: 4,
            padding: {
                left: 10,
                right: 10
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            fontFamily: 'Cairo',
            fontSize: '13px',
            markers: {
                radius: 12
            }
        },
        tooltip: {
            theme: 'dark',
            style: {
                fontFamily: 'Cairo'
            },
            y: {
                formatter: (value) => {
                    return new Intl.NumberFormat('ar-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 0
                    }).format(value);
                }
            }
        },
        markers: {
            size: 0,
            hover: {
                size: 6
            }
        }
    };

    // --- Prepare Series Data ---
    const series = [
        {
            name: 'المبيعات',
            data: data?.datasets?.sales || []
        },
        {
            name: 'المشتريات',
            data: data?.datasets?.purchases || []
        },
        ...(expensesEnabled ? [{
            name: 'المصاريف',
            data: data?.datasets?.expenses || []
        }] : []),
        ...(comparisonEnabled && data?.datasets?.sales_compare ? [{
            name: 'مبيعات (فترة سابقة)',
            data: data?.datasets?.sales_compare || []
        }] : [])
    ];

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    return (
        <div className="neumorphic h-[480px] flex flex-col overflow-hidden animate-fade-in">
            {/* Header & Controls */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                            <i className="bi bi-graph-up-arrow text-white text-xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                تحليل الأداء المالي
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                متابعة المبيعات والمشتريات والمصاريف
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Period Buttons */}
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
                            {PERIODS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriod(p.id)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${period === p.id
                                            ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-md'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <i className={`bi ${p.icon}`} />
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-8 bg-gray-200 dark:bg-slate-600 mx-2" />

                        {/* Toggle Buttons */}
                        <button
                            onClick={() => setExpensesEnabled(!expensesEnabled)}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${expensesEnabled
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shadow-md'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                            title="عرض المصاريف"
                        >
                            <i className="bi bi-cash-stack text-lg" />
                        </button>

                        <button
                            onClick={() => setComparisonEnabled(!comparisonEnabled)}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${comparisonEnabled
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-md'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                            title="مقارنة مع الفترة السابقة"
                        >
                            <i className="bi bi-arrow-left-right text-lg" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 p-4">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</span>
                        </div>
                    </div>
                )}

                {data ? (
                    <Chart
                        options={chartOptions}
                        series={series}
                        type="area"
                        height="100%"
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <i className="bi bi-graph-up text-4xl opacity-50" />
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            {data?.summary && (
                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex justify-around text-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <i className="bi bi-cart-check text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">مبيعات الفترة</p>
                                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(data.summary.total_sales)}
                                </p>
                            </div>
                            {comparisonEnabled && data.summary.sales_change !== undefined && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${data.summary.sales_change >= 0
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    <i className={`bi ${data.summary.sales_change >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`} />
                                    {Math.abs(data.summary.sales_change)}%
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <i className="bi bi-bag text-red-600 dark:text-red-400" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">المشتريات</p>
                                <p className="font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(data.summary.total_purchases)}
                                </p>
                            </div>
                        </div>

                        {expensesEnabled && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <i className="bi bi-receipt text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">المصاريف</p>
                                    <p className="font-bold text-amber-600 dark:text-amber-400">
                                        {formatCurrency(data.summary.total_expenses)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedChartWidget;
