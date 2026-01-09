import React, { useState, useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { GlassCard } from '../DashboardWidgets';
import { getAdvancedChartData } from '../../../api/reports';
import { format, subDays, startOfMonth, startOfYear, endOfMonth, endOfYear, subMonths, subYears } from 'date-fns';
import { ar } from 'date-fns/locale';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Constants
const PERIODS = [
    { id: 'week', label: '7 أيام' },
    { id: 'month', label: '30 يوم' },
    { id: 'year', label: 'سنة' },
];

const AdvancedChartWidget = () => {
    // --- State ---
    const [period, setPeriod] = useState('week'); // week, month, year
    const [comparisonEnabled, setComparisonEnabled] = useState(false);
    const [expensesEnabled, setExpensesEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const chartRef = useRef(null);

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
            end = today; // Or endOfYear if looking at past years
            compStart = startOfYear(subYears(today, 1));
            compEnd = subYears(today, 1); // Same date last year
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


    // --- Chart Config ---
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    color: '#9ca3af', // text-gray-400
                    font: { family: 'Cairo' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900
                titleFont: { family: 'Cairo', size: 13 },
                bodyFont: { family: 'Cairo', size: 12 },
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af', font: { family: 'Cairo' } }
            },
            y: {
                grid: { color: 'rgba(156, 163, 175, 0.1)' }, // gray-400 with opacity
                ticks: { color: '#9ca3af', font: { family: 'Cairo' } }
            }
        },
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        }
    };

    // --- Prepare Datasets ---
    const chartDataFormatted = {
        labels: data?.labels || [],
        datasets: [
            {
                label: 'المبيعات',
                data: data?.datasets?.sales || [],
                borderColor: '#10b981', // emerald-500
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                order: 1
            },
            {
                label: 'المشتريات',
                data: data?.datasets?.purchases || [],
                borderColor: '#ef4444', // red-500
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                fill: true,
                tension: 0.4,
                order: 2
            },
            ...(expensesEnabled ? [{
                label: 'المصاريف',
                data: data?.datasets?.expenses || [],
                borderColor: '#f59e0b', // amber-500
                borderDash: [5, 5],
                tension: 0.4,
                order: 3
            }] : []),
            ...(comparisonEnabled && data?.datasets?.sales_compare ? [{
                label: 'مبيعات (فترة سابقة)',
                data: data?.datasets?.sales_compare || [],
                borderColor: '#10b981',
                borderDash: [4, 4],
                pointRadius: 0,
                borderWidth: 1,
                opacity: 0.5,
                tension: 0.4,
                order: 4
            }] : [])
        ]
    };


    return (
        <GlassCard className="h-[450px] flex flex-col p-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <i className="bi bi-graph-up-arrow text-emerald-500"></i>
                        تحليل الأداء المالي
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">متابعة المبيعات والمشتريات والمصاريف</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm">
                    {/* Period Buttons */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        {PERIODS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${period === p.id
                                        ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Toggles */}
                    <button
                        onClick={() => setExpensesEnabled(!expensesEnabled)}
                        className={`p-2 rounded-lg transition-colors duration-200 border ${expensesEnabled
                                ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400'
                                : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title="عرض المصاريف"
                    >
                        <i className="bi bi-cash-stack"></i>
                    </button>

                    <button
                        onClick={() => setComparisonEnabled(!comparisonEnabled)}
                        className={`p-2 rounded-lg transition-colors duration-200 border ${comparisonEnabled
                                ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                                : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title="مقارنة مع الفترة السابقة"
                    >
                        <i className="bi bi-arrow-left-right"></i>
                    </button>

                    <button
                        onClick={() => {
                            if (chartRef.current) {
                                chartRef.current.reset(); // Reset animation
                                chartRef.current.update();
                            }
                        }}
                        className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                        title="إعادة الرسم"
                    >
                        <i className="bi bi-play-circle"></i>
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 min-h-0">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 dark:bg-gray-900/30 backdrop-blur-[1px] rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                )}

                {data ? (
                    <Line ref={chartRef} options={chartOptions} data={chartDataFormatted} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        جاري تحميل البيانات...
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            {data?.summary && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-around text-center">
                    <div>
                        <p className="text-xs text-gray-500">مبيعات الفترة</p>
                        <p className="font-bold text-lg text-emerald-600">
                            {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(data.summary.total_sales)}
                        </p>
                        {comparisonEnabled && (
                            <span className={`text-xs ${data.summary.sales_change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {data.summary.sales_change > 0 ? '+' : ''}{data.summary.sales_change}%
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">المشتريات</p>
                        <p className="font-bold text-lg text-red-500">
                            {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(data.summary.total_purchases)}
                        </p>
                    </div>
                    {expensesEnabled && (
                        <div>
                            <p className="text-xs text-gray-500">المصاريف</p>
                            <p className="font-bold text-lg text-amber-500">
                                {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(data.summary.total_expenses)}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </GlassCard>
    );
};

export default AdvancedChartWidget;
