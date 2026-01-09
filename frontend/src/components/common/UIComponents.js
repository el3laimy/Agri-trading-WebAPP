import React from 'react';

/**
 * Page header component
 */
export function PageHeader({ icon, title, subtitle }) {
    return (
        <div className="mb-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {icon && (
                            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                                <i className={`bi ${icon}`}></i>
                            </span>
                        )}
                        {title}
                    </h2>
                    {subtitle && <p className="text-gray-500 dark:text-gray-400 mt-1 ms-12">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

/**
 * Search input component
 */
export function SearchInput({ value, onChange, placeholder = 'بحث...' }) {
    return (
        <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                <i className="bi bi-search text-gray-400 dark:text-gray-500"></i>
            </div>
            <input
                type="text"
                className="block w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 ps-10 p-2.5 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-slate-800 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

/**
 * Add button component
 */
export function AddButton({ isOpen, onClick, openText = 'إلغاء', closedText = 'إضافة جديد' }) {
    return (
        <button
            className={`nav-link px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 ${isOpen ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50' : 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent'}`}
            onClick={onClick}
        >
            <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
            {isOpen ? openText : closedText}
        </button>
    );
}

/**
 * Card wrapper component
 */
export function Card({ title, icon, children, headerActions, className = '' }) {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors ${className}`}>
            {(title || headerActions) && (
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0 flex items-center gap-2">
                        {icon && <i className={`bi ${icon} text-emerald-600 dark:text-emerald-400`}></i>}
                        {title}
                    </h5>
                    {headerActions}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

/**
 * Status badge component
 */
export function StatusBadge({ status, labels = {} }) {
    const defaultLabels = {
        PAID: { text: 'مدفوع', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800' },
        PARTIAL: { text: 'جزئي', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
        PENDING: { text: 'معلق', className: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' },
        ACTIVE: { text: 'نشط', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
        INACTIVE: { text: 'غير نشط', className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600' },
        ...labels
    };

    const config = defaultLabels[status] || { text: status, className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600' };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${config.className}`}>
            {config.text}
        </span>
    );
}

export default PageHeader;
