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
        <div className="lg-card">
            <div className="p-6">
                <Skeleton width="60%" height="1.5rem" className="mb-4" />
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton key={i} width={`${100 - i * 15}%`} className="mb-3" />
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
/**
 * Stats Card Skeleton - for KPI cards
 */
export function StatsCardSkeleton({ count = 4 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="lg-card p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-600"></div>
                        <div className="flex-1">
                            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-16 mb-2"></div>
                            <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-12"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Filter Chips Skeleton
 */
export function FilterChipsSkeleton({ count = 3 }) {
    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-slate-600 rounded-full animate-pulse"></div>
            ))}
        </div>
    );
}

/**
 * Management Page Skeleton - for Sales, Purchases, Expenses pages
 */
export function ManagementPageSkeleton({ showStats = true, showFilters = true, tableRows = 5, tableColumns = 6 }) {
    return (
        <div className="p-6 max-w-full mx-auto animate-fade-in">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-64 animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            {showStats && <StatsCardSkeleton count={4} />}

            {/* Search and Filter Skeleton */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded-lg w-full md:w-96 animate-pulse"></div>
            </div>

            {/* Filter Chips Skeleton */}
            {showFilters && <FilterChipsSkeleton count={4} />}

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-32 animate-pulse"></div>
                </div>
                <TableSkeleton rows={tableRows} columns={tableColumns} />
            </div>
        </div>
    );
}

/**
 * Inventory Page Skeleton - for InventoryView
 */
export function InventorySkeleton({ cardCount = 6 }) {
    return (
        <div className="p-6 max-w-full mx-auto animate-fade-in">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-64 animate-pulse"></div>
            </div>

            {/* Stats Cards */}
            <StatsCardSkeleton count={4} />

            {/* Search */}
            <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded-lg w-full md:w-96 mb-6 animate-pulse"></div>

            {/* Filter Chips */}
            <FilterChipsSkeleton count={3} />

            {/* Inventory Cards Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-32 mb-6 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: cardCount }).map((_, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-slate-600"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-24 mb-2"></div>
                                    <div className="h-6 bg-gray-200 dark:bg-slate-600 rounded w-16"></div>
                                </div>
                                <div className="h-6 w-16 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Treasury Page Skeleton
 */
export function TreasurySkeleton() {
    return (
        <div className="p-6 max-w-full mx-auto animate-fade-in">
            {/* Header Skeleton */}
            <div className="mb-6">
                <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-64 animate-pulse"></div>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 animate-pulse">
                <div className="h-4 bg-white/20 rounded w-24 mb-3"></div>
                <div className="h-10 bg-white/20 rounded w-48 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-32"></div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mb-6">
                <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded-lg w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-600 rounded-lg w-32 animate-pulse"></div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between">
                    <div className="h-5 bg-gray-200 dark:bg-slate-600 rounded w-32 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded w-24 animate-pulse"></div>
                </div>
                <TableSkeleton rows={5} columns={5} />
            </div>
        </div>
    );
}

export default LoadingSpinner;
