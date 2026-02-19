/**
 * PageHeader.js
 * Reusable page header component with LiquidGlass design system
 */

import React, { useEffect, useState } from 'react';
import '../../styles/liquidglass.css';
import '../../styles/dashboardAnimations.css';

/**
 * Floating Decorative Element - Glass refraction blobs
 */
function FloatingBlob({ className, delay = 0 }) {
    return (
        <div
            className={`absolute rounded-full bg-white/10 blur-3xl pointer-events-none ${className}`}
            style={{ animationDelay: `${delay}s`, animation: 'lg-liquid-float 8s ease-in-out infinite' }}
        />
    );
}

/**
 * Animated Particles Background - Subtle glass sparkle effect
 */
function ParticlesEffect() {
    const particles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1.5,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 4
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-white/15 lg-animate-float"
                    style={{
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`
                    }}
                />
            ))}
        </div>
    );
}

/**
 * PageHeader - LiquidGlass page header with translucent gradient
 */
export function PageHeader({
    title,
    subtitle,
    icon = 'bi-folder',
    gradient = 'from-emerald-500 to-teal-500',
    actions,
    children,
    showParticles = true,
    showBlobs = true
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className={`lg-page-header transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Glass-layered Gradient Header */}
            <div className={`lg-page-header-bg relative bg-gradient-to-br ${gradient} overflow-hidden`}>

                {/* Floating Blobs */}
                {showBlobs && (
                    <>
                        <FloatingBlob className="w-64 h-64 -top-20 -right-20" delay={0} />
                        <FloatingBlob className="w-48 h-48 -bottom-10 -left-10" delay={-3} />
                        <FloatingBlob className="w-32 h-32 top-1/2 right-1/4" delay={-5} />
                    </>
                )}

                {/* Particles */}
                {showParticles && <ParticlesEffect />}

                {/* Content */}
                <div className="lg-page-header-content">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Title Section */}
                        <div className="flex items-center gap-4 lg-animate-in">
                            <div
                                className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center lg-animate-float"
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    animationDuration: '4s'
                                }}
                            >
                                <i className={`bi ${icon} text-white text-2xl md:text-3xl`} />
                            </div>
                            <div className="text-white">
                                <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                                {subtitle && (
                                    <p className="text-white/80 mt-1 lg-animate-in lg-stagger-2">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {actions && (
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap lg-animate-in lg-stagger-3 relative z-30">
                                {actions}
                            </div>
                        )}
                    </div>

                    {/* Children (Stats, etc.) */}
                    {children && (
                        <div className="mt-6 lg-animate-in lg-stagger-4 relative z-20">
                            {children}
                        </div>
                    )}
                </div>

                {/* Decorative Corner Shapes */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-br-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-black/10 to-transparent rounded-tl-full pointer-events-none" />
            </div>
        </div>
    );
}

/**
 * StatsBar - Glass stat cards for page headers
 */
export function StatsBar({ stats = [] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`lg-stat-glass px-4 py-3 rounded-xl flex items-center gap-3 lg-hover-lift lg-animate-in lg-stagger-${Math.min(index + 1, 8)}`}
                    style={{
                        background: 'rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.18)'
                    }}
                >
                    <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient || 'from-white/20 to-white/10'} flex items-center justify-center lg-animate-float`}
                        style={{ animationDelay: `${index * 0.2}s` }}
                    >
                        <i className={`bi ${stat.icon} text-white text-lg`} />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">{stat.label}</p>
                        <p className="text-lg font-bold text-white number-counter">{stat.value}</p>
                    </div>
                    {stat.trend !== undefined && (
                        <div className={`ml-auto text-xs font-medium px-2 py-1 rounded-lg lg-animate-scale ${stat.trend >= 0
                            ? 'bg-green-500/30 text-green-200'
                            : 'bg-red-500/30 text-red-200'
                            }`}>
                            <i className={`bi ${stat.trend >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`} />
                            {Math.abs(stat.trend)}%
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/**
 * ActionButton - LiquidGlass action button
 */
export function ActionButton({
    label,
    icon,
    onClick,
    variant = 'primary',
    disabled = false
}) {
    const variants = {
        primary: 'lg-btn lg-btn-primary',
        secondary: 'lg-btn lg-btn-secondary',
        danger: 'lg-btn lg-btn-danger',
        ghost: 'lg-btn lg-btn-ghost text-white'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                inline-flex items-center px-5 py-2.5 font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant]}
            `}
            style={{ borderRadius: 'var(--lg-radius-sm)' }}
        >
            {icon && <i className={`bi ${icon} mr-2`} />}
            {label}
        </button>
    );
}

/**
 * SearchBox - LiquidGlass search input
 */
export function SearchBox({
    value,
    onChange,
    placeholder = 'بحث...',
    className = ''
}) {
    return (
        <div className={`relative lg-animate-fade ${className}`}>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <i className="bi bi-search" style={{ color: 'var(--lg-text-muted)' }} />
            </div>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="lg-input w-full pr-12 pl-4"
                style={{ borderRadius: 'var(--lg-radius-sm)' }}
            />
        </div>
    );
}

/**
 * FilterChip - LiquidGlass filter chips with glass effect when active
 */
export function FilterChip({
    label,
    count,
    icon,
    active = false,
    onClick,
    color = 'emerald'
}) {
    const inactiveStyle = {
        background: 'var(--lg-glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid var(--lg-glass-border-subtle)',
        color: 'var(--lg-text-secondary)'
    };

    const colors = {
        emerald: active
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-lg'
            : '',
        blue: active
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 shadow-lg'
            : '',
        amber: active
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-lg'
            : '',
        rose: active
            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700 shadow-lg'
            : '',
        red: active
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 shadow-lg'
            : '',
        indigo: active
            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 shadow-lg'
            : '',
    };

    return (
        <button
            onClick={onClick}
            className={`
                lg-btn inline-flex items-center gap-2 px-4 py-2
                font-medium text-sm
                ${active ? `border-2 ${colors[color]}` : ''}
            `}
            style={{
                borderRadius: 'var(--lg-radius-pill)',
                ...(active ? {} : inactiveStyle)
            }}
        >
            {icon && <i className={`bi ${icon} ${active ? 'lg-animate-scale' : ''}`} />}
            <span>{label}</span>
            {count !== undefined && (
                <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={active
                        ? { background: 'rgba(255,255,255,0.5)' }
                        : { background: 'var(--lg-glass-bg-hover)' }
                    }
                >
                    {count}
                </span>
            )}
        </button>
    );
}

/**
 * EmptyStateCard - LiquidGlass empty state
 */
export function EmptyStateCard({
    icon = 'bi-inbox',
    title,
    description,
    action
}) {
    return (
        <div className="text-center py-16 lg-animate-fade">
            <div
                className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float lg-hover-lift"
                style={{
                    borderRadius: 'var(--lg-radius-lg)',
                    background: 'var(--lg-glass-bg)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--lg-glass-border)',
                    boxShadow: 'var(--lg-glass-shadow)'
                }}
            >
                <i className={`bi ${icon} text-5xl`} style={{ color: 'var(--lg-text-muted)' }} />
            </div>
            <h4 className="font-semibold text-lg mb-2 lg-animate-in lg-stagger-1" style={{ color: 'var(--lg-text-primary)' }}>{title}</h4>
            {description && (
                <p className="text-sm mb-6 max-w-sm mx-auto lg-animate-in lg-stagger-2" style={{ color: 'var(--lg-text-muted)' }}>{description}</p>
            )}
            <div className="lg-animate-in lg-stagger-3">
                {action}
            </div>
        </div>
    );
}

/**
 * LoadingCard - LiquidGlass skeleton loading
 */
export function LoadingCard({ rows = 5 }) {
    return (
        <div>
            {[...Array(rows)].map((_, i) => (
                <div
                    key={i}
                    className={`p-4 flex items-center gap-4 lg-animate-fade lg-stagger-${Math.min(i + 1, 8)}`}
                    style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)' }}
                >
                    <div className="lg-skeleton lg-skeleton-avatar" />
                    <div className="flex-1 space-y-2">
                        <div className="lg-skeleton lg-skeleton-title" style={{ animationDelay: `${i * 0.1}s` }} />
                        <div className="lg-skeleton lg-skeleton-text w-1/2" style={{ animationDelay: `${i * 0.15}s` }} />
                    </div>
                    <div className="lg-skeleton" style={{ width: '80px', height: '32px', animationDelay: `${i * 0.2}s` }} />
                </div>
            ))}
        </div>
    );
}

export default PageHeader;
