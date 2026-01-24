/**
 * PageHeader.js
 * Reusable page header component with gradient background, animations, and stats
 */

import React, { useEffect, useState } from 'react';

// Import CSS animations
import '../../styles/dashboardAnimations.css';

/**
 * Floating Decorative Element
 */
function FloatingBlob({ className, delay = 0 }) {
    return (
        <div
            className={`absolute rounded-full bg-white/10 blur-3xl animate-blob pointer-events-none ${className}`} // Added pointer-events-none
            style={{ animationDelay: `${delay}s` }}
        />
    );
}

/**
 * Animated Particles Background
 */
function ParticlesEffect() {
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 3
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-white/20 animate-float"
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
 * PageHeader - Header component for all pages with advanced animations
 * @param {string} title - Page title
 * @param {string} subtitle - Page description
 * @param {string} icon - Bootstrap icon class
 * @param {string} gradient - Tailwind gradient classes
 * @param {React.ReactNode} actions - Action buttons
 * @param {React.ReactNode} children - Additional content (stats, etc.)
 * @param {boolean} showParticles - Show particle effects
 * @param {boolean} showBlobs - Show floating blobs
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
        <div className={`neumorphic overflow-hidden mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Animated Gradient Header */}
            <div className={`relative bg-gradient-to-br ${gradient} p-6 overflow-hidden animate-gradient`} style={{ backgroundSize: '200% 200%' }}>

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
                <div className="relative z-20"> {/* INCREASED Z-INDEX to be above particles/blobs */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Title Section */}
                        <div className="flex items-center gap-4 animate-fade-in-up">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm hover-scale transition-transform animate-float" style={{ animationDuration: '4s' }}>
                                <i className={`bi ${icon} text-white text-3xl`} />
                            </div>
                            <div className="text-white">
                                <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                                {subtitle && (
                                    <p className="text-white/80 mt-1 animate-fade-in stagger-2">{subtitle}</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {actions && (
                            <div className="flex items-center gap-3 animate-fade-in-up stagger-3 relative z-30"> {/* EXTRA Z-INDEX validity */}
                                {actions}
                            </div>
                        )}
                    </div>

                    {/* Children (Stats, etc.) */}
                    {children && (
                        <div className="mt-6 animate-fade-in-up stagger-4 relative z-20">
                            {children}
                        </div>
                    )}
                </div>

                {/* Decorative Corner Shapes - Added pointer-events-none */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-br-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-black/10 to-transparent rounded-tl-full pointer-events-none" />
            </div>
        </div>
    );
}

/**
 * StatsBar - Mini stats bar for quick overview with staggered animations
 */
export function StatsBar({ stats = [] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`glass-premium px-4 py-3 rounded-xl flex items-center gap-3 hover-lift hover-shine transition-all animate-fade-in-up stagger-${index + 1}`}
                >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient || 'from-white/20 to-white/10'} flex items-center justify-center animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                        <i className={`bi ${stat.icon} text-white text-lg`} />
                    </div>
                    <div>
                        <p className="text-xs text-white/70">{stat.label}</p>
                        <p className="text-lg font-bold text-white number-counter">{stat.value}</p>
                    </div>
                    {stat.trend !== undefined && (
                        <div className={`ml-auto text-xs font-medium px-2 py-1 rounded-lg animate-bounce-in ${stat.trend >= 0
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
 * ActionButton - Styled action button for page headers
 */
export function ActionButton({
    label,
    icon,
    onClick,
    variant = 'primary',
    disabled = false
}) {
    const variants = {
        primary: 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl',
        secondary: 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg',
        ghost: 'bg-transparent text-white hover:bg-white/20'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                inline-flex items-center px-5 py-2.5 rounded-xl font-medium
                transition-all duration-300 hover-scale btn-ripple
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant]}
            `}
        >
            {icon && <i className={`bi ${icon} mr-2`} />}
            {label}
        </button>
    );
}

/**
 * SearchBox - Enhanced search input with animations
 */
export function SearchBox({
    value,
    onChange,
    placeholder = 'بحث...',
    className = ''
}) {
    return (
        <div className={`relative animate-fade-in ${className}`}>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <i className="bi bi-search text-gray-400 animate-pulse" style={{ animationDuration: '2s' }} />
            </div>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="
                    w-full pr-12 pl-4 py-3 
                    neumorphic-inset rounded-xl
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                    transition-all duration-300 hover:shadow-lg
                "
            />
        </div>
    );
}

/**
 * FilterChip - Filter chips/pills for filtering data with animations
 */
export function FilterChip({
    label,
    count,
    icon,
    active = false,
    onClick,
    color = 'emerald'
}) {
    const colors = {
        emerald: active
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-lg'
            : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700',
        blue: active
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 shadow-lg'
            : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700',
        amber: active
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-lg'
            : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
    };

    return (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl
                border-2 font-medium text-sm
                transition-all duration-300 hover-scale hover-shine
                ${colors[color]}
            `}
        >
            {icon && <i className={`bi ${icon} ${active ? 'animate-bounce-in' : ''}`} />}
            <span>{label}</span>
            {count !== undefined && (
                <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    transition-all duration-300
                    ${active
                        ? 'bg-white/50 dark:bg-white/20 animate-count-up'
                        : 'bg-gray-200 dark:bg-slate-600'
                    }
                `}>
                    {count}
                </span>
            )}
        </button>
    );
}

/**
 * EmptyStateCard - Beautiful empty state display with animations
 */
export function EmptyStateCard({
    icon = 'bi-inbox',
    title,
    description,
    action
}) {
    return (
        <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center animate-float hover-lift transition-all">
                <i className={`bi ${icon} text-5xl text-gray-400 dark:text-gray-500`} />
            </div>
            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2 animate-fade-in-up stagger-1">{title}</h4>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto animate-fade-in-up stagger-2">{description}</p>
            )}
            <div className="animate-fade-in-up stagger-3">
                {action}
            </div>
        </div>
    );
}

/**
 * LoadingCard - Skeleton loading state with shimmer
 */
export function LoadingCard({ rows = 5 }) {
    return (
        <div className="animate-pulse">
            {[...Array(rows)].map((_, i) => (
                <div
                    key={i}
                    className={`p-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4 animate-fade-in stagger-${Math.min(i + 1, 8)}`}
                >
                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-slate-700 animate-shimmer" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 animate-shimmer" style={{ animationDelay: `${i * 0.15}s` }} />
                    </div>
                    <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded-lg animate-shimmer" style={{ animationDelay: `${i * 0.2}s` }} />
                </div>
            ))}
        </div>
    );
}

export default PageHeader;
