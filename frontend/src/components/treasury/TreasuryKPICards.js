import React from 'react';

/**
 * Component for treasury KPI cards display - Tailwind CSS version
 */
function TreasuryKPICards({ summary, formatCurrency }) {
    if (!summary) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Opening Balance */}
            <div className="bg-gray-100 dark:bg-slate-700 rounded-xl shadow-sm p-5">
                <small className="text-gray-500 dark:text-gray-400 block mb-2">رصيد البداية</small>
                <h4 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-0">{formatCurrency(summary.opening_balance)}</h4>
            </div>

            {/* Inflow (+ sign) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-green-600">
                <small className="text-gray-500 dark:text-gray-400 block mb-2">
                    <i className="bi bi-plus-lg text-green-600 dark:text-green-400 ml-1"></i>
                    مقبوضات اليوم
                </small>
                <h4 className="text-xl font-bold text-green-600 dark:text-green-400 mb-0">{formatCurrency(summary.total_in_today)}</h4>
            </div>

            {/* Outflow (- sign) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-red-500">
                <small className="text-gray-500 dark:text-gray-400 block mb-2">
                    <i className="bi bi-dash-lg text-red-500 dark:text-red-400 ml-1"></i>
                    مدفوعات اليوم
                </small>
                <h4 className="text-xl font-bold text-red-500 dark:text-red-400 mb-0">{formatCurrency(summary.total_out_today)}</h4>
            </div>

            {/* Closing Balance (= sign) */}
            <div className="rounded-xl shadow-sm p-5 text-white" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #0D3320 100%)' }}>
                <small className="text-white/60 block mb-2">
                    <i className="bi bi-equals ml-1"></i>
                    رصيد الإغلاق
                </small>
                <h4 className="text-xl font-bold mb-0">{formatCurrency(summary.closing_balance)}</h4>
            </div>
        </div>
    );
}

export default TreasuryKPICards;
