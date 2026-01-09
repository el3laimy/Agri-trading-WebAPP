import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { GlassCard, EmptyState, SectionHeader } from '../DashboardWidgets';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const SalesDistributionWidget = ({ salesByCrop, loading }) => { // Expecting enriched data
    const { theme } = useTheme();
    const [viewMode, setViewMode] = useState('value'); // 'value' (EGP) or 'volume' (KG)

    // Custom Scrollbar Style for this component
    const scrollbarStyle = `
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: ${theme === 'dark' ? '#475569' : '#CBD5E1'};
            border-radius: 20px;
        }
    `;

    // Filter out very small values for the chart to look clean
    const filteredData = salesByCrop.filter(item =>
        viewMode === 'value' ? item.value > 0 : item.volume > 0
    );

    // Calculate Totals for Percentages
    const totalValue = salesByCrop.reduce((sum, item) => sum + (item.value || 0), 0);
    const totalVolume = salesByCrop.reduce((sum, item) => sum + (item.volume || 0), 0);
    const currentTotal = viewMode === 'value' ? totalValue : totalVolume;

    // Palette
    const colors = [
        '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];

    const chartData = {
        labels: filteredData.map(s => s.crop),
        datasets: [{
            data: filteredData.map(s => viewMode === 'value' ? s.value : s.volume),
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 8
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%', // Thinner ring for better look
        plugins: {
            legend: {
                display: false // Custom legend
            },
            tooltip: {
                backgroundColor: theme === 'dark' ? '#1E293B' : '#fff',
                titleColor: theme === 'dark' ? '#F8FAFC' : '#1E293B',
                bodyColor: theme === 'dark' ? '#CBD5E1' : '#475569',
                titleFont: { family: 'Cairo' },
                bodyFont: { family: 'Cairo' },
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        const val = context.raw;
                        const label = context.label;
                        const percentage = currentTotal > 0 ? ((val / currentTotal) * 100).toFixed(1) + '%' : '0%';

                        if (viewMode === 'value') {
                            return `${label}: ${new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val)} (${percentage})`;
                        } else {
                            return `${label}: ${new Intl.NumberFormat('ar-EG').format(val)} كجم (${percentage})`;
                        }
                    }
                }
            }
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);
    const formatNumber = (val) => new Intl.NumberFormat('ar-EG').format(val);

    return (
        <GlassCard className="h-[430px] flex flex-col p-6 animate-fade-in relative overflow-hidden">
            <style>{scrollbarStyle}</style>

            {/* Header with Toggles */}
            <div className="flex justify-between items-center mb-6">
                <SectionHeader title="توزيع المبيعات" icon="bi-pie-chart" />

                <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('value')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'value'
                                ? 'bg-white dark:bg-gray-600 text-emerald-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        القيمة
                    </button>
                    <button
                        onClick={() => setViewMode('volume')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'volume'
                                ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        الكمية
                    </button>
                </div>
            </div>

            {/* Content Area: Chart + Legend */}
            {/* Added: flex-reverse to switch chart and legend positions for better balance in RTL */}
            <div className="flex-1 flex flex-col md:flex-row-reverse items-center gap-4 min-h-0">

                {/* Chart Circle - Right in LTR, Left in RTL (due to flex-row-reverse + RTL direction) */}
                <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0">
                    {filteredData.length > 0 ? (
                        <>
                            <Doughnut data={chartData} options={options} />
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-gray-400 text-[10px] font-medium mb-1">الإجمالي</span>
                                <span className={`text-base font-bold text-center leading-tight px-2 ${viewMode === 'value' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {viewMode === 'value'
                                        ? formatNumber(totalValue) + ' ج.م'
                                        : formatNumber(Math.round(totalVolume / 1000)) + ' طن'
                                    }
                                </span>
                            </div>
                        </>
                    ) : (
                        <EmptyState icon="bi-pie-chart" title="لا توجد بيانات" />
                    )}
                </div>

                {/* Vertical Separator (Hidden on Mobile) */}
                <div className="hidden md:block w-px h-32 bg-gray-100 dark:bg-gray-700 mx-2"></div>

                {/* Detailed Legend */}
                <div className="flex-1 w-full overflow-y-auto max-h-56 pr-2 custom-scrollbar">
                    <div className="space-y-2">
                        {filteredData.sort((a, b) => (viewMode === 'value' ? b.value - a.value : b.volume - a.volume)).map((item, index) => {
                            const val = viewMode === 'value' ? (item.value || 0) : (item.volume || 0);
                            const percentage = currentTotal > 0 ? ((val / currentTotal) * 100) : 0;

                            return (
                                <div key={item.crop} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-default">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: colors[index % colors.length] }}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{item.crop}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 rounded-md">
                                                    {item.count ? `${item.count}` : '0'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left flex-shrink-0 pl-2">
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 dir-ltr text-right">
                                            {formatNumber(val)} <span className="text-[10px] text-gray-500 font-normal">{viewMode === 'value' ? 'ج.م' : 'كجم'}</span>
                                        </p>
                                        <div className="w-16 h-1 mt-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ml-auto">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
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
        </GlassCard>
    );
};

export default SalesDistributionWidget;
