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
            <div className="lg-card lg-glass-thin lg-animate-fade overflow-hidden">
                <div className="p-6 border-b border-white/10 dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <i className="bi bi-lightning-charge-fill text-white text-xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                                    إجراءات سريعة
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">وصول سريع للعمليات الأساسية</p>
                            </div>
                        </div>
                        <button
                            onClick={onOpenCommandPalette}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all duration-300 border border-gray-200/50 dark:border-slate-600/50 hover:border-amber-500/30 flex items-center gap-2 group backdrop-blur-sm"
                        >
                            <i className="bi bi-search group-hover:text-amber-500 transition-colors" />
                            <span>بحث سريع</span>
                            <kbd className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-600 font-mono text-gray-400">
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
                                className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:shadow-lg transition-all duration-300 border border-white/20 dark:border-white/5 hover:border-amber-500/30 hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 relative z-10`}>
                                    <i className={`bi ${action.icon} text-white text-2xl drop-shadow-md`} />
                                </div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200 text-center group-hover:text-gray-900 dark:group-hover:text-white transition-colors relative z-10">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuickActionsWidget;
