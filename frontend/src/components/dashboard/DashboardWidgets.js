import React from 'react';
import { CountUp, Sparkline, ProgressRing, TrendBadge, ParticlesBackground, WeatherWidget, RealTimeClock } from './AnimatedComponents';

/**
 * Glass Card Component - بطاقة بتأثير زجاجي محسّن
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
 * Neumorphic KPI Card - بطاقة عصرية مع تأثيرات متقدمة
 */
export function NeumorphicKpiCard({
    title,
    value,
    icon,
    gradient = 'from-emerald-500 to-teal-500',
    trend,
    subtitle,
    sparklineData = [],
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
                neumorphic hover-lift hover-shine
                animate-fade-in-up
                ${onClick ? 'cursor-pointer' : ''}
            `}
        >
            {/* Gradient Accent on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            {/* Border Accent */}
            <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${gradient} rounded-r-full`} />

            {/* Header with Icon */}
            <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`bi ${icon} text-white text-2xl`} />
                </div>

                {/* Sparkline */}
                {sparklineData.length > 0 && (
                    <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                        <Sparkline
                            data={sparklineData}
                            width={80}
                            height={35}
                            color={gradient.includes('emerald') ? '#10b981' :
                                gradient.includes('blue') ? '#3b82f6' :
                                    gradient.includes('amber') ? '#f59e0b' :
                                        gradient.includes('red') ? '#ef4444' : '#10b981'}
                        />
                    </div>
                )}
            </div>

            {/* Content */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <CountUp
                    end={typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0}
                    duration={1500}
                    prefix={typeof formatValue(1) === 'string' && formatValue(1).includes('ج.م') ? '' : ''}
                    suffix={typeof formatValue(1) === 'string' && formatValue(1).includes('ج.م') ? ' ج.م' : ''}
                    decimals={0}
                />
            </h3>

            {/* Subtitle */}
            {subtitle && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
            )}

            {/* Trend Indicator */}
            {trend !== undefined && trend !== null && (
                <div className="mt-3">
                    <TrendBadge value={trend} />
                </div>
            )}
        </div>
    );
}

/**
 * KPI Card المحسنة مع Gradient و Trend - للتوافق مع الكود القديم
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
    // Generate fake sparkline data based on value
    const generateSparkline = () => {
        const base = typeof value === 'number' ? value : 0;
        return Array.from({ length: 7 }, (_, i) => base * (0.7 + Math.random() * 0.6));
    };

    return (
        <NeumorphicKpiCard
            title={title}
            value={value}
            icon={icon}
            gradient={gradient}
            trend={trend}
            subtitle={subtitle}
            sparklineData={generateSparkline()}
            onClick={onClick}
            delay={delay}
            formatValue={formatValue}
        />
    );
}

/**
 * Mini Stat Pill - للشريط العلوي المحسّن
 */
export function MiniStatPill({ label, value, icon, trend }) {
    return (
        <div className="glass-premium px-5 py-3 rounded-2xl text-white flex items-center gap-4 hover-scale cursor-default">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <i className={`bi ${icon} text-lg`} />
            </div>
            <div className="flex-grow">
                <p className="text-xs text-white/70">{label}</p>
                <p className="font-bold text-base">{value}</p>
            </div>
            {trend !== undefined && (
                <div className={`text-xs font-medium px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}`}>
                    <i className={`bi ${trend >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`} />
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
    );
}

/**
 * Section Header المحسّن
 */
export function SectionHeader({ title, icon, action, badge }) {
    return (
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                {icon && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <i className={`bi ${icon} text-white`} />
                    </div>
                )}
                {title}
                {badge && (
                    <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        {badge}
                    </span>
                )}
            </h3>
            {action}
        </div>
    );
}

/**
 * Activity Item - عنصر محسّن في قائمة النشاط
 */
export function ActivityItem({ activity, formatCurrency, formatRelativeTime }) {
    const typeConfig = {
        sale: {
            bg: 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
            text: 'text-emerald-600 dark:text-emerald-400',
            amount: 'text-emerald-600 dark:text-emerald-400'
        },
        purchase: {
            bg: 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
            text: 'text-blue-600 dark:text-blue-400',
            amount: 'text-blue-600 dark:text-blue-400'
        },
        expense: {
            bg: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
            text: 'text-amber-600 dark:text-amber-400',
            amount: 'text-amber-600 dark:text-amber-400'
        }
    };

    const config = typeConfig[activity.type] || typeConfig.expense;

    return (
        <div className={`p-4 rounded-xl ${config.bg} hover:scale-[1.02] transition-all duration-300 flex items-center gap-4 group mb-3`}>
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.iconBg} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <i className={`bi ${activity.icon} text-lg`} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{activity.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{activity.contact}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span>{formatRelativeTime ? formatRelativeTime(activity.timestamp) : activity.timestamp}</span>
                </p>
            </div>
            <div className={`text-xl font-bold ${config.amount}`}>
                {formatCurrency ? formatCurrency(activity.amount) : activity.amount}
            </div>
        </div>
    );
}

/**
 * Season Progress Card - بطاقة تقدم الموسم المحسّنة
 */
export function SeasonProgressCard({ season, formatDate }) {
    if (!season) {
        return (
            <div className="neumorphic p-6 animate-fade-in">
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
                        <i className="bi bi-calendar-x text-4xl text-amber-500" />
                    </div>
                    <p className="font-medium">لا يوجد موسم نشط حالياً</p>
                </div>
            </div>
        );
    }

    return (
        <div className="neumorphic overflow-hidden animate-fade-in">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <i className="bi bi-calendar-check text-2xl" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{season.name}</h3>
                        <p className="text-sm text-white/80">
                            {formatDate ? formatDate(season.start_date) : season.start_date} - {formatDate ? formatDate(season.end_date) : season.end_date}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <ProgressRing
                            progress={season.progress || 0}
                            size={70}
                            strokeWidth={8}
                            color="#f59e0b"
                        >
                            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                {season.progress}%
                            </span>
                        </ProgressRing>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">مكتمل</p>
                            <p className="font-bold text-gray-900 dark:text-white">{season.progress}%</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">متبقي</p>
                        <p className="font-bold text-amber-600 dark:text-amber-400">{season.days_remaining} يوم</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="overflow-hidden h-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out animate-shimmer"
                        style={{ width: `${season.progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Empty State المحسّن
 */
export function EmptyState({ icon, title, description, action }) {
    return (
        <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <i className={`bi ${icon} text-5xl text-gray-400 dark:text-gray-500`} />
            </div>
            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">{title}</h4>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
            {action}
        </div>
    );
}

/**
 * Dashboard Skeleton Loader المحسّن
 */
export function DashboardSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Hero Skeleton */}
            <div className="h-52 bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800/30 dark:to-teal-800/30 rounded-3xl mb-8 animate-shimmer" />

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-44 neumorphic rounded-2xl animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 h-96 neumorphic rounded-2xl animate-shimmer" />
                <div className="h-96 neumorphic rounded-2xl animate-shimmer" style={{ animationDelay: '200ms' }} />
            </div>

            {/* Activity Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-80 neumorphic rounded-2xl animate-shimmer" />
                <div className="h-80 neumorphic rounded-2xl animate-shimmer" style={{ animationDelay: '100ms' }} />
            </div>
        </div>
    );
}

/**
 * Refresh Button المحسّن
 */
export function RefreshButton({ onClick, isRefreshing }) {
    return (
        <button
            onClick={onClick}
            disabled={isRefreshing}
            className="px-5 py-3 glass-premium text-white rounded-2xl hover:bg-white/30 transition-all flex items-center gap-2 disabled:opacity-50 hover-scale"
        >
            <i className={`bi ${isRefreshing ? 'bi-arrow-repeat animate-spin' : 'bi-arrow-clockwise'} text-lg`} />
            <span className="text-sm font-medium">{isRefreshing ? 'جاري التحديث...' : 'تحديث'}</span>
        </button>
    );
}

/**
 * Hero Section المحسّن - New Premium Component
 */
export function HeroSection({
    greeting,
    username,
    subtitle,
    balanceCheck,
    onNavigate,
    onConfigClick,
    onRefresh,
    isRefreshing,
    quickStats = []
}) {
    return (
        <div className="mb-8 animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl hero-gradient p-8 shadow-2xl">
                {/* Animated Background Elements */}
                <ParticlesBackground count={15} />
                <div className="hero-blob hero-blob-1" />
                <div className="hero-blob hero-blob-2" />

                {/* Decorative Floating Shapes */}
                <div className="absolute top-10 left-10 w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm rotate-12 animate-float" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-10 right-20 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-1/3 w-12 h-12 rounded-xl bg-teal-400/20 backdrop-blur-sm rotate-45 animate-float" style={{ animationDelay: '1.5s' }} />

                <div className="relative z-10">
                    {/* Top Row: Greeting & Actions */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        {/* Welcome Section */}
                        <div className="text-white">
                            <h1 className="text-4xl font-bold mb-3 flex items-center gap-4">
                                <span className="text-5xl animate-float">👋</span>
                                {greeting}، {username || 'مستخدم'}
                            </h1>
                            <p className="text-emerald-100 text-xl">{subtitle}</p>
                        </div>

                        {/* Right Side: Weather, Clock, Actions */}
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Weather Widget */}
                            <WeatherWidget />

                            {/* Real Time Clock */}
                            <div className="glass-premium px-4 py-3 rounded-2xl">
                                <RealTimeClock />
                            </div>

                            {/* Balance Indicators - Dual */}
                            {balanceCheck && (
                                <div className="flex items-center gap-2">
                                    {/* مؤشر التوازن الدفتري */}
                                    <div
                                        onClick={() => onNavigate('/reports/capital-distribution')}
                                        className={`glass-premium px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-2 hover-scale ${balanceCheck.is_balanced === null
                                            ? ''
                                            : balanceCheck.is_balanced
                                                ? 'ring-2 ring-green-400/50'
                                                : 'ring-2 ring-red-400/50'
                                            }`}
                                        title={balanceCheck.status}
                                    >
                                        <i className={`bi ${balanceCheck.is_balanced === null
                                            ? 'bi-question-circle'
                                            : balanceCheck.is_balanced
                                                ? 'bi-check-circle-fill text-green-300'
                                                : 'bi-exclamation-triangle-fill text-red-300'
                                            }`} />
                                        <span className="text-xs font-medium text-white">
                                            {balanceCheck.is_balanced ? 'متوازن' : `فرق: ${balanceCheck.difference?.toLocaleString()}`}
                                        </span>
                                    </div>
                                    {/* مؤشر فرق المخزون */}
                                    {balanceCheck.inventory_discrepancy?.has_discrepancy && (
                                        <div
                                            onClick={() => onNavigate('/inventory')}
                                            className="glass-premium px-3 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-2 hover-scale ring-2 ring-amber-400/50"
                                            title={`دفتري: ${balanceCheck.inventory_discrepancy?.ledger_inventory?.toLocaleString()} | فعلي: ${balanceCheck.inventory_discrepancy?.physical_inventory?.toLocaleString()}`}
                                        >
                                            <i className="bi bi-box-seam text-amber-300" />
                                            <span className="text-xs font-medium text-white">
                                                مخزون: {balanceCheck.inventory_discrepancy?.amount?.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Config Button */}
                            <button
                                onClick={onConfigClick}
                                className="p-3 glass-premium text-white rounded-2xl hover:bg-white/30 transition-all hover-scale"
                                title="تخصيص"
                            >
                                <i className="bi bi-gear text-xl" />
                            </button>

                            {/* Refresh Button */}
                            <RefreshButton onClick={onRefresh} isRefreshing={isRefreshing} />
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickStats.map((stat, index) => (
                            <MiniStatPill
                                key={index}
                                label={stat.label}
                                value={stat.value}
                                icon={stat.icon}
                                trend={stat.trend}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GlassCard;
