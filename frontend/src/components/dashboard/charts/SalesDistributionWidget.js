import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { SectionHeader, EmptyState } from '../DashboardWidgets';
import { useTheme } from '../../../context/ThemeContext';

const SalesDistributionWidget = ({ salesByCrop = [], loading }) => {
    const { theme } = useTheme();
    const [viewMode, setViewMode] = useState('value');

    // Filter out zero values
    const filteredData = salesByCrop.filter(item =>
        viewMode === 'value' ? item.value > 0 : item.volume > 0
    );

    // Calculate Totals
    const totalValue = salesByCrop.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    const totalVolume = salesByCrop.reduce((sum, item) => sum + (parseFloat(item.volume) || 0), 0);
    const currentTotal = viewMode === 'value' ? totalValue : totalVolume;

    // Color Palette
    const colors = [
        '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];

    // ApexCharts Configuration
    const chartOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'Cairo, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 1200,
                animateGradually: {
                    enabled: true,
                    delay: 200
                }
            },
            dropShadow: {
                enabled: true,
                blur: 8,
                opacity: 0.2
            }
        },
        colors: colors,
        labels: filteredData.map(s => s.crop),
        stroke: {
            width: 0
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '14px',
                            fontFamily: 'Cairo',
                            color: theme === 'dark' ? '#F8FAFC' : '#1E293B'
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontFamily: 'Cairo',
                            fontWeight: 700,
                            color: theme === 'dark' ? '#10B981' : '#059669',
                            formatter: (val) => {
                                if (viewMode === 'value') {
                                    return new Intl.NumberFormat('en-US').format(val) + ' ج.م';
                                }
                                return new Intl.NumberFormat('en-US').format(val) + ' كجم';
                            }
                        },
                        total: {
                            show: true,
                            label: 'الإجمالي',
                            fontSize: '12px',
                            fontFamily: 'Cairo',
                            color: theme === 'dark' ? '#94A3B8' : '#64748B',
                            formatter: () => {
                                if (viewMode === 'value') {
                                    return new Intl.NumberFormat('en-US').format(totalValue) + ' ج.م';
                                }
                                return new Intl.NumberFormat('en-US').format(Math.round(totalVolume / 1000)) + ' طن';
                            }
                        }
                    }
                },
                expandOnClick: true
            }
        },
        dataLabels: {
            enabled: false
        },
        legend: {
            show: false
        },
        tooltip: {
            enabled: true,
            theme: theme,
            style: {
                fontFamily: 'Cairo'
            },
            y: {
                formatter: (val) => {
                    const percentage = currentTotal > 0 ? ((val / currentTotal) * 100).toFixed(1) : 0;
                    if (viewMode === 'value') {
                        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val) + ` (${percentage}%)`;
                    }
                    return new Intl.NumberFormat('en-US').format(val) + ` كجم (${percentage}%)`;
                }
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'lighten',
                    value: 0.1
                }
            }
        }
    };

    const series = filteredData.map(s => viewMode === 'value' ? s.value : s.volume);

    const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val);

    return (
        <div className="lg-card h-[480px] flex flex-col overflow-hidden lg-animate-fade">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <i className="bi bi-pie-chart text-white text-xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                توزيع المبيعات
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                حسب المحصول
                            </p>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('value')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${viewMode === 'value'
                                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <i className="bi bi-currency-dollar mr-1" />
                            القيمة
                        </button>
                        <button
                            onClick={() => setViewMode('volume')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${viewMode === 'volume'
                                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <i className="bi bi-box-seam mr-1" />
                            الكمية
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart & Legend */}
            <div className="flex-1 flex flex-col lg:flex-row items-center p-6 gap-6 overflow-hidden">
                {/* Chart */}
                <div className="w-48 h-48 lg:w-56 lg:h-56 flex-shrink-0">
                    {filteredData.length > 0 ? (
                        <Chart
                            options={chartOptions}
                            series={series}
                            type="donut"
                            height="100%"
                        />
                    ) : (
                        <EmptyState icon="bi-pie-chart" title="لا توجد بيانات" />
                    )}
                </div>

                {/* Legend */}
                <div className="flex-1 w-full overflow-y-auto max-h-72">
                    <div className="space-y-2">
                        {filteredData
                            .sort((a, b) => (viewMode === 'value' ? b.value - a.value : b.volume - a.volume))
                            .map((item, index) => {
                                const val = viewMode === 'value' ? (item.value || 0) : (item.volume || 0);
                                const percentage = currentTotal > 0 ? ((val / currentTotal) * 100) : 0;

                                return (
                                    <div
                                        key={item.crop}
                                        className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-700/30 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-4 h-4 rounded-lg shadow-sm flex-shrink-0"
                                                style={{ backgroundColor: colors[index % colors.length] }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                                                    {item.crop}
                                                </p>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {item.count || 0} عملية
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-left flex-shrink-0">
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                                {formatNumber(val)}
                                                <span className="text-xs text-gray-500 font-normal mr-1">
                                                    {viewMode === 'value' ? 'ج.م' : 'كجم'}
                                                </span>
                                            </p>
                                            <div className="w-20 h-1.5 mt-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: colors[index % colors.length]
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDistributionWidget;
