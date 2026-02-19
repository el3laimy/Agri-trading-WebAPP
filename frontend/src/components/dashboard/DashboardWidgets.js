import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { CountUp, Sparkline, ProgressRing, TrendBadge, ParticlesBackground, WeatherWidget, RealTimeClock } from './AnimatedComponents';
import '../../styles/liquidglass.css';

/**
 * Glass Card Component - بطاقة بتأثير زجاجي محسّن
 */
export function GlassCard({ children, className = '', hover = true }) {
    return (
        <div className={`lg-card ${hover ? 'lg-hover-lift' : ''} ${className}`}>
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
                lg-metric-card group relative overflow-hidden p-6
                lg-animate-in
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
            <p className="text-sm mb-2 font-medium" style={{ color: 'var(--lg-text-secondary)' }}>{title}</p>
            <h3 className="text-3xl font-bold mb-2" style={{ color: 'var(--lg-text-primary)' }}>
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
    return (
        <NeumorphicKpiCard
            title={title}
            value={value}
            icon={icon}
            gradient={gradient}
            trend={trend}
            subtitle={subtitle}
            sparklineData={[]}
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
        <div
            className="px-5 py-3 rounded-2xl text-white flex items-center gap-4 cursor-default"
            style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.18)',
                transition: 'var(--lg-transition-fast)'
            }}
        >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
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
            <h3 className="text-lg font-bold flex items-center gap-3" style={{ color: 'var(--lg-text-primary)' }}>
                {icon && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <i className={`bi ${icon} text-white`} />
                    </div>
                )}
                {title}
                {badge && (
                    <span className="lg-badge lg-badge--danger text-xs px-2.5 py-1 font-medium">
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
            <div className="lg-panel p-6 lg-animate-fade">
                <div className="text-center py-8" style={{ color: 'var(--lg-text-muted)' }}>
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
                        <i className="bi bi-calendar-x text-4xl text-amber-500" />
                    </div>
                    <p className="font-medium">لا يوجد موسم نشط حالياً</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lg-card overflow-hidden lg-animate-fade">
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
        <div className="text-center py-16 lg-animate-fade">
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--lg-glass-border)' }}>
                <i className={`bi ${icon} text-5xl`} style={{ color: 'var(--lg-text-muted)' }} />
            </div>
            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>{title}</h4>
            {description && <p className="text-sm mb-4" style={{ color: 'var(--lg-text-muted)' }}>{description}</p>}
            {action}
        </div>
    );
}

/**
 * Dashboard Skeleton Loader المحسّن
 */
export function DashboardSkeleton() {
    return (
        <div>
            {/* Hero Skeleton */}
            <div className="lg-skeleton h-52 rounded-3xl mb-8" />

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="lg-skeleton h-44 rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 lg-skeleton h-96 rounded-2xl" />
                <div className="lg-skeleton h-96 rounded-2xl" style={{ animationDelay: '200ms' }} />
            </div>

            {/* Activity Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 lg-skeleton h-80 rounded-2xl" />
                <div className="lg-skeleton h-80 rounded-2xl" style={{ animationDelay: '100ms' }} />
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
            className="lg-btn px-5 py-3 text-white flex items-center gap-2 disabled:opacity-50"
            style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--lg-radius-md)'
            }}
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
    const [showBalanceModal, setShowBalanceModal] = useState(false);

    return (
        <div className="mb-8 lg-animate-fade">
            {/* Balance Details Modal - Using Portal to escape overflow-hidden */}
            {showBalanceModal && balanceCheck && ReactDOM.createPortal(
                <div className="lg-modal-overlay" style={{ zIndex: 100 }} aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="lg-modal" style={{ maxWidth: '680px' }}>
                        <div className="lg-modal-header flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                                <i className="bi bi-calculator" style={{ color: 'var(--lg-primary)' }} />
                                تحليل توازن النظام
                            </h3>
                            <button onClick={() => setShowBalanceModal(false)} className="lg-btn lg-btn-ghost">
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>

                        <div className="lg-modal-body">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-xl mb-6 flex items-center gap-4 ${balanceCheck.is_balanced ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                                <i className={`bi ${balanceCheck.is_balanced ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} text-2xl`} />
                                <div>
                                    <h4 className="font-bold text-lg">{balanceCheck.status}</h4>
                                    {!balanceCheck.is_balanced && <p className="text-sm opacity-80">يوجد فرق في القيد المحاسبي المزدوج. يرجى مراجعة التفاصيل أدناه.</p>}
                                </div>
                            </div>

                            {/* Accounting Equation */}
                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 border-b pb-2">المعادلة المحاسبية</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--lg-glass-bg)' }}>
                                        <p className="text-xs mb-1" style={{ color: 'var(--lg-text-muted)' }}>الأصول</p>
                                        <p className="font-bold text-lg">{parseFloat(balanceCheck.details?.assets || 0).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--lg-glass-bg)' }}>
                                        <p className="text-xs mb-1" style={{ color: 'var(--lg-text-muted)' }}>الخصوم</p>
                                        <p className="font-bold text-lg">{parseFloat(balanceCheck.details?.liabilities || 0).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--lg-glass-bg)' }}>
                                        <p className="text-xs mb-1" style={{ color: 'var(--lg-text-muted)' }}>حقوق الملكية + الأرباح</p>
                                        <p className="font-bold text-lg">{(parseFloat(balanceCheck.details?.capital || 0) + parseFloat(balanceCheck.details?.net_profit || 0)).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl border-2 ${balanceCheck.is_balanced ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                                        <p className="text-xs text-gray-500 mb-1">الفرق</p>
                                        <p className={`font-bold text-lg ${balanceCheck.is_balanced ? 'text-green-600' : 'text-red-600'}`}>
                                            {parseFloat(balanceCheck.difference || 0).toLocaleString('en-US')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Unbalanced Transactions List */}
                            {balanceCheck.unbalanced_transactions && balanceCheck.unbalanced_transactions.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-red-600 mb-2 border-b border-red-100 pb-2 flex items-center gap-2">
                                        <i className="bi bi-bug-fill" />
                                        المعاملات غير المتوازنة (المسبب)
                                    </h4>
                                    <div className="max-h-60 overflow-y-auto bg-red-50/50 rounded-xl border border-red-100">
                                        <table className="w-full text-sm text-right">
                                            <thead className="bg-red-100/50 text-red-700 font-medium">
                                                <tr>
                                                    <th className="p-2">نوع العملية</th>
                                                    <th className="p-2">رقم المعاملة</th>
                                                    <th className="p-2">مدين</th>
                                                    <th className="p-2">دائن</th>
                                                    <th className="p-2">الفرق</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-red-100">
                                                {balanceCheck.unbalanced_transactions.map((tx, idx) => (
                                                    <tr key={idx} className="hover:bg-red-100/30 transition-colors">
                                                        <td className="p-2">{tx.source_type}</td>
                                                        <td className="p-2 font-mono">{tx.source_id}</td>
                                                        <td className="p-2">{parseFloat(tx.total_debit).toLocaleString('en-US')}</td>
                                                        <td className="p-2">{parseFloat(tx.total_credit).toLocaleString('en-US')}</td>
                                                        <td className="p-2 font-bold text-red-600">{parseFloat(tx.difference).toLocaleString('en-US')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg-modal-footer">
                            <button
                                onClick={() => setShowBalanceModal(false)}
                                className="lg-btn lg-btn-secondary px-6 py-2"
                                style={{ borderRadius: 'var(--lg-radius-sm)' }}
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="relative overflow-hidden rounded-3xl hero-gradient p-8 shadow-2xl">
                {/* Animated Background Elements - Removed for cleaner look */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-teal-800/90 dark:from-emerald-900/40 dark:to-teal-900/40 backdrop-blur-md" />

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
                            <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                <RealTimeClock />
                            </div>

                            {/* Balance Indicators - Dual */}
                            {balanceCheck && (
                                <div className="flex items-center gap-2">
                                    {/* مؤشر التوازن الدفتري */}
                                    <div
                                        onClick={() => setShowBalanceModal(true)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setShowBalanceModal(true)}
                                        className={`px-3 py-2 rounded-xl cursor-pointer flex items-center gap-2 ${balanceCheck.is_balanced === null
                                            ? ''
                                            : balanceCheck.is_balanced
                                                ? 'ring-2 ring-green-400/50'
                                                : 'ring-2 ring-red-400/50'
                                            }`}
                                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', transition: 'var(--lg-transition-fast)' }}
                                        title={balanceCheck.status}
                                        aria-label={balanceCheck.status}
                                    >
                                        <i className={`bi ${balanceCheck.is_balanced === null
                                            ? 'bi-question-circle'
                                            : balanceCheck.is_balanced
                                                ? 'bi-check-circle-fill text-green-300'
                                                : 'bi-exclamation-triangle-fill text-red-300'
                                            }`} />
                                        <span className="text-xs font-medium text-white">
                                            {balanceCheck.is_balanced ? 'متوازن' : `فرق: ${(parseFloat(balanceCheck.difference) || 0).toLocaleString('en-US')}`}
                                        </span>
                                    </div>
                                    {/* مؤشر فرق المخزون */}
                                    {balanceCheck.inventory_discrepancy?.has_discrepancy && (
                                        <div
                                            onClick={() => onNavigate('/inventory')}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && onNavigate('/inventory')}
                                            className="px-3 py-2 rounded-xl cursor-pointer flex items-center gap-2 ring-2 ring-amber-400/50"
                                            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', transition: 'var(--lg-transition-fast)' }}
                                            title={`دفتري: ${balanceCheck.inventory_discrepancy?.ledger_inventory?.toLocaleString('en-US')} | فعلي: ${balanceCheck.inventory_discrepancy?.physical_inventory?.toLocaleString('en-US')}`}
                                            aria-label="عرض تفاصيل المخزون"
                                        >
                                            <i className="bi bi-box-seam text-amber-300" />
                                            <span className="text-xs font-medium text-white">
                                                مخزون: {(parseFloat(balanceCheck.inventory_discrepancy?.amount) || 0).toLocaleString('en-US')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Config Button */}
                            <button
                                onClick={onConfigClick}
                                className="lg-btn p-3 text-white"
                                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--lg-radius-md)' }}
                                title="تخصيص"
                                aria-label="تخصيص لوحة التحكم"
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
