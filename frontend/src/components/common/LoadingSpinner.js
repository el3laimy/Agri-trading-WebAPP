import React from 'react';

/**
 * Loading spinner component - Tailwind CSS version
 */
export function LoadingSpinner({ size = 'md', color = 'emerald', text = null }) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    const colorClasses = {
        primary: 'border-emerald-600 border-t-transparent',
        emerald: 'border-emerald-600 border-t-transparent',
        blue: 'border-blue-600 border-t-transparent',
        gray: 'border-gray-600 border-t-transparent'
    };

    return (
        <div className="flex flex-col items-center justify-center py-4">
            <div
                className={`${sizeClasses[size]} ${colorClasses[color] || colorClasses.emerald} rounded-full animate-spin`}
                role="status"
            >
                <span className="sr-only">جاري التحميل...</span>
            </div>
            {text && <p className="text-gray-500 dark:text-gray-400 mt-3 mb-0">{text}</p>}
        </div>
    );
}

/**
 * Full page loading overlay
 */
export function PageLoading({ text = 'جاري التحميل...' }) {
    return (
        <div className="flex justify-center items-center h-[50vh]">
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner() {
    return (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" role="status">
            <span className="sr-only">جاري التحميل...</span>
        </span>
    );
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton({ width = '100%', height = '1rem', className = '', rounded = false }) {
    return (
        <div
            className={`animate-pulse ${className}`}
            style={{ width }}
        >
            <span
                className={`block bg-gray-300 dark:bg-slate-600 ${rounded ? 'rounded-full' : 'rounded'}`}
                style={{ width: '100%', height }}
            ></span>
        </div>
    );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton({ lines = 3 }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="p-5">
                <Skeleton width="60%" height="1.5rem" className="mb-3" />
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton key={i} width={`${100 - i * 15}%`} className="mb-2" />
                ))}
            </div>
        </div>
    );
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3"><Skeleton width="80%" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {Array.from({ length: rows }).map((_, rowIdx) => (
                        <tr key={rowIdx} className="bg-white dark:bg-slate-800">
                            {Array.from({ length: columns }).map((_, colIdx) => (
                                <td key={colIdx} className="px-4 py-3"><Skeleton width={`${70 + Math.random() * 30}%`} /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default LoadingSpinner;
