import React from 'react';
import { Link } from 'react-router-dom';

// Color mapping for Tailwind
const colorStyles = {
    primary: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        hover: 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50'
    },
    success: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        hover: 'group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50'
    },
    info: {
        bg: 'bg-cyan-100 dark:bg-cyan-900/30',
        text: 'text-cyan-600 dark:text-cyan-400',
        hover: 'group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50'
    },
    warning: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-600 dark:text-amber-400',
        hover: 'group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50'
    },
    danger: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        hover: 'group-hover:bg-red-200 dark:group-hover:bg-red-900/50'
    },
    indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-600 dark:text-indigo-400',
        hover: 'group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50'
    },
    teal: {
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        text: 'text-teal-600 dark:text-teal-400',
        hover: 'group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50'
    },
};

function ReportCard({ title, description, icon, to, color = 'primary' }) {
    const styles = colorStyles[color] || colorStyles.primary;

    return (
        <Link to={to} className="no-underline col-span-1">
            <div className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 h-full flex flex-col overflow-hidden text-right">
                <div className="text-center p-6 flex-1 flex flex-col items-center justify-center">
                    <div className={`w-20 h-20 rounded-full ${styles.bg} ${styles.hover} flex items-center justify-center mb-4 transition-colors duration-300`}>
                        <i className={`bi ${icon} text-4xl ${styles.text}`}></i>
                    </div>
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h5>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-0">{description}</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 text-center py-3">
                    <span className={`${styles.text} font-bold text-sm flex items-center justify-center gap-1`}>
                        عرض التقرير <i className="bi bi-arrow-left"></i>
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default ReportCard;
