import React from 'react';

/**
 * Glass Card Component - بطاقة بتأثير زجاجي
 */
export function GlassCard({ children, className = '', hover = true }) {
    return (
        <div className={`
            bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
            rounded-2xl border border-white/50 dark:border-slate-700/50
            shadow-lg transition-all duration-300
            ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
            ${className}
        `}>
            {children}
        </div>
    );
}

/**
 * KPI Card المحسنة مع Gradient و Trend
 */
export function GlassKpiCard({
    title,
    value,
    icon,
    gradient = 'from-emerald-500 to-teal-500',
    trend,
    subtitle,
    onClick,
    delay = 0,
    formatValue = (v) => v
}) {
    return (
        <div
            onClick={onClick}
            style={{ animationDelay: `${delay}ms` }}
            className={`
                group relative overflow-hidden rounded-2xl p-6 
                bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
                border border-gray-100/50 dark:border-slate-700/50
                shadow-lg hover:shadow-xl
                transition-all duration-300 hover:-translate-y-1
                animate-fade-in-up
                ${onClick ? 'cursor-pointer' : ''}
            `}
        >
            {/* Gradient Accent on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            {/* Border Accent */}
            <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${gradient} rounded-r-full`} />

            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-lg mb-4`}>
                <i className={`bi ${icon} text-white text-xl`} />
            </div>

            {/* Content */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatValue(value)}
            </h3>

            {/* Subtitle */}
            {subtitle && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
            )}

            {/* Trend Indicator */}
            {trend !== undefined && trend !== null && (
                <div className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                        trend < 0 ? 'text-red-500 dark:text-red-400' :
                            'text-gray-500 dark:text-gray-400'
                    }`}>
                    <i className={`bi ${trend > 0 ? 'bi-arrow-up-right' : trend < 0 ? 'bi-arrow-down-right' : 'bi-dash'}`} />
                    <span>{Math.abs(trend)}%</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">
                        {trend > 0 ? 'زيادة' : trend < 0 ? 'انخفاض' : 'ثابت'}
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * Mini Stat Pill - للشريط العلوي
 */
export function MiniStatPill({ label, value, icon }) {
    return (
        <div className="bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white flex items-center gap-3 border border-white/10">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <i className={`bi ${icon} text-sm`} />
            </div>
            <div>
                <p className="text-xs text-white/70">{label}</p>
                <p className="font-bold text-sm">{value}</p>
            </div>
        </div>
    );
}

/**
 * Section Header
 */
export function SectionHeader({ title, icon, action }) {
    return (
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                {icon && <i className={`bi ${icon} text-emerald-600 dark:text-emerald-400`} />}
                {title}
            </h3>
            {action}
        </div>
    );
}

/**
 * Activity Item - عنصر في قائمة النشاط
 */
export function ActivityItem({ activity, formatCurrency, formatRelativeTime }) {
    const typeConfig = {
        sale: {
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            amount: 'text-emerald-600 dark:text-emerald-400'
        },
        purchase: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            amount: 'text-blue-600 dark:text-blue-400'
        },
        expense: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            amount: 'text-amber-600 dark:text-amber-400'
        }
    };

    const config = typeConfig[activity.type] || typeConfig.expense;

    return (
        <div className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-4 group">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.text} transition-transform group-hover:scale-110`}>
                <i className={`bi ${activity.icon}`} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{activity.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.contact} • {formatRelativeTime ? formatRelativeTime(activity.timestamp) : activity.timestamp}
                </p>
            </div>
            <div className={`text-lg font-bold ${config.amount}`}>
                {formatCurrency ? formatCurrency(activity.amount) : activity.amount}
            </div>
        </div>
    );
}

/**
 * Season Progress Card - بطاقة تقدم الموسم
 */
export function SeasonProgressCard({ season, formatDate }) {
    if (!season) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/50">
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i className="bi bi-calendar-x text-4xl mb-2 block opacity-50" />
                    <p>لا يوجد موسم نشط حالياً</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/50 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <i className="bi bi-calendar-check text-white text-2xl" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{season.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate ? formatDate(season.start_date) : season.start_date} - {formatDate ? formatDate(season.end_date) : season.end_date}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative pt-2">
                <div className="flex mb-2 justify-between text-xs">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{season.progress}% مكتمل</span>
                    <span className="text-gray-500 dark:text-gray-400">{season.days_remaining} يوم متبقي</span>
                </div>
                <div className="overflow-hidden h-3 rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${season.progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Empty State
 */
export function EmptyState({ icon, title, description }) {
    return (
        <div className="text-center py-12">
            <i className={`bi ${icon} text-6xl text-gray-200 dark:text-gray-700 mb-4 block`} />
            <h4 className="text-gray-500 dark:text-gray-400 font-medium mb-2">{title}</h4>
            {description && <p className="text-sm text-gray-400 dark:text-gray-500">{description}</p>}
        </div>
    );
}

/**
 * Dashboard Skeleton Loader
 */
export function DashboardSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Hero Skeleton */}
            <div className="h-44 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl mb-8" />

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-36 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 h-80 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
                <div className="h-80 bg-gray-200 dark:bg-slate-700 rounded-2xl" />
            </div>
        </div>
    );
}

/**
 * Refresh Button
 */
export function RefreshButton({ onClick, isRefreshing }) {
    return (
        <button
            onClick={onClick}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
        >
            <i className={`bi ${isRefreshing ? 'bi-arrow-repeat animate-spin' : 'bi-arrow-clockwise'}`} />
            <span className="text-sm font-medium">{isRefreshing ? 'جاري...' : 'تحديث'}</span>
        </button>
    );
}

export default GlassCard;
