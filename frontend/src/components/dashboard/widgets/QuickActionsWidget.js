/**
 * QuickActionsWidget - Displays quick action buttons
 * Extracted from Dashboard.js renderWidget switch case
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
    { label: 'بيع جديد', icon: 'bi-cart-plus', gradient: 'from-emerald-500 to-teal-500', path: '/sales' },
    { label: 'شراء جديد', icon: 'bi-bag-plus', gradient: 'from-blue-500 to-cyan-500', path: '/purchases' },
    { label: 'الخزينة', icon: 'bi-safe2', gradient: 'from-amber-500 to-orange-500', path: '/treasury' },
    { label: 'مصروف جديد', icon: 'bi-receipt', gradient: 'from-red-500 to-rose-500', path: '/expenses' },
    { label: 'تقرير الأرباح', icon: 'bi-graph-up', gradient: 'from-cyan-500 to-blue-500', path: '/reports/income-statement' },
    { label: 'جهات التعامل', icon: 'bi-people', gradient: 'from-gray-500 to-slate-500', path: '/contacts' },
    { label: 'المخزون', icon: 'bi-box-seam', gradient: 'from-indigo-500 to-purple-500', path: '/inventory' },
    { label: 'دفتر الأستاذ', icon: 'bi-journal-bookmark', gradient: 'from-purple-500 to-pink-500', path: '/reports/general-ledger' }
];

export function QuickActionsWidget({ onOpenCommandPalette }) {
    const navigate = useNavigate();

    return (
        <div className="mb-8">
            <div className="neumorphic animate-fade-in">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                                <i className="bi bi-lightning-charge text-white text-xl" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    إجراءات سريعة
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">وصول سريع للعمليات الأساسية</p>
                            </div>
                        </div>
                        <button
                            onClick={onOpenCommandPalette}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <i className="bi bi-search" />
                            <span>بحث سريع</span>
                            <kbd className="text-xs px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded border border-gray-200 dark:border-slate-500 font-mono">
                                Ctrl+K
                            </kbd>
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {ACTIONS.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => navigate(action.path)}
                                className="group flex flex-col items-center justify-center p-5 rounded-2xl bg-gray-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-gray-100 dark:hover:border-slate-600"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                                    <i className={`bi ${action.icon} text-white text-2xl`} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuickActionsWidget;
