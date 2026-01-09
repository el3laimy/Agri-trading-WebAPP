import React from 'react';

function KpiCard({ title, value, formatAsCurrency = true, icon = 'bi-graph-up', trend = null, trendValue = null }) {
    const formattedValue = formatAsCurrency
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(value)
        : value;

    return (
        <div className="w-full md:w-1/2 lg:w-1/4 p-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 h-full relative overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h6 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2">{title}</h6>
                        <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formattedValue}</h3>
                        {trend && (
                            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                <i className={`bi ${trend === 'up' ? 'bi-arrow-up-short' : 'bi-arrow-down-short'} text-lg`}></i>
                                <span>{trendValue}</span>
                            </div>
                        )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <i className={`bi ${icon} text-xl`}></i>
                    </div>
                </div>
                {/* Decorative background circle */}
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 -top-5 -left-5"></div>
            </div>
        </div>
    );
}

export default KpiCard;

