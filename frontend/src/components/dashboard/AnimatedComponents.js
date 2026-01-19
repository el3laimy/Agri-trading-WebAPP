/**
 * AnimatedComponents.js
 * Premium Animation Components for Dashboard Redesign
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

// ===== CountUp Animation Component =====
export function CountUp({
    end,
    duration = 2000,
    prefix = '',
    suffix = '',
    decimals = 0,
    separator = ',',
    startOnMount = true,
    className = ''
}) {
    const [count, setCount] = useState(0);
    const countRef = useRef(null);
    const startTimeRef = useRef(null);

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    useEffect(() => {
        if (!startOnMount) return;

        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            const easedProgress = easeOutQuart(progress);

            setCount(easedProgress * end);

            if (progress < 1) {
                countRef.current = requestAnimationFrame(animate);
            }
        };

        countRef.current = requestAnimationFrame(animate);

        return () => {
            if (countRef.current) {
                cancelAnimationFrame(countRef.current);
            }
        };
    }, [end, duration, startOnMount]);

    const formatNumber = (num) => {
        const fixed = num.toFixed(decimals);
        const parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        return parts.join('.');
    };

    return (
        <span className={`number-counter ${className}`}>
            {prefix}{formatNumber(count)}{suffix}
        </span>
    );
}

// ===== Sparkline Chart Component =====
export function Sparkline({
    data = [],
    width = 100,
    height = 30,
    color = '#10b981',
    fillOpacity = 0.2,
    strokeWidth = 2,
    animated = true
}) {
    const [pathLength, setPathLength] = useState(0);
    const pathRef = useRef(null);

    const points = data.length > 0 ? data : [0, 0];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;

    const xStep = width / (points.length - 1 || 1);

    const getY = (value) => {
        return height - ((value - min) / range) * height * 0.8 - height * 0.1;
    };

    const pathData = points.map((point, i) => {
        const x = i * xStep;
        const y = getY(point);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

    useEffect(() => {
        if (pathRef.current && animated) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, [data, animated]);

    return (
        <svg width={width} height={height} className="sparkline">
            <defs>
                <linearGradient id={`sparkGradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>

            {/* Fill Area */}
            <path
                d={areaPath}
                fill={`url(#sparkGradient-${color.replace('#', '')})`}
                className={animated ? 'animate-fade-in' : ''}
            />

            {/* Line */}
            <path
                ref={pathRef}
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={animated && pathLength ? {
                    strokeDasharray: pathLength,
                    strokeDashoffset: 0,
                    animation: 'sparklineDraw 1.5s ease-out forwards'
                } : {}}
            />

            {/* End Dot */}
            <circle
                cx={width}
                cy={getY(points[points.length - 1])}
                r={3}
                fill={color}
                className={animated ? 'animate-fade-in stagger-5' : ''}
            />
        </svg>
    );
}

// ===== Progress Ring Component =====
export function ProgressRing({
    progress = 0,
    size = 60,
    strokeWidth = 6,
    color = '#10b981',
    bgColor = 'rgba(0,0,0,0.1)',
    children
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="progress-ring">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="progress-ring-circle"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}

// ===== Floating Element Component =====
export function FloatingElement({
    children,
    delay = 0,
    duration = 3,
    distance = 10,
    className = ''
}) {
    return (
        <div
            className={`${className}`}
            style={{
                animation: `float ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                '--float-distance': `${distance}px`
            }}
        >
            {children}
        </div>
    );
}

// ===== Animated Icon Component =====
export function AnimatedIcon({
    icon,
    gradient = 'from-emerald-500 to-teal-500',
    size = 48,
    className = ''
}) {
    return (
        <div
            className={`
                inline-flex items-center justify-center rounded-xl 
                bg-gradient-to-br ${gradient} shadow-lg
                hover:scale-110 transition-transform duration-300
                ${className}
            `}
            style={{ width: size, height: size }}
        >
            <i className={`bi ${icon} text-white`} style={{ fontSize: size * 0.45 }} />
        </div>
    );
}

// ===== Ripple Button Component =====
export function RippleButton({
    children,
    onClick,
    className = '',
    ...props
}) {
    const buttonRef = useRef(null);

    const createRipple = useCallback((event) => {
        const button = buttonRef.current;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);

        if (onClick) onClick(event);
    }, [onClick]);

    return (
        <button
            ref={buttonRef}
            onClick={createRipple}
            className={`btn-ripple ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

// ===== Typing Animation Component =====
export function TypingText({
    text,
    speed = 100,
    delay = 0,
    className = ''
}) {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let timeout;
        let index = 0;

        const startTyping = () => {
            if (index < text.length) {
                setDisplayText(text.slice(0, index + 1));
                index++;
                timeout = setTimeout(startTyping, speed);
            } else {
                setIsComplete(true);
            }
        };

        timeout = setTimeout(startTyping, delay);

        return () => clearTimeout(timeout);
    }, [text, speed, delay]);

    return (
        <span className={className}>
            {displayText}
            {!isComplete && <span className="animate-pulse">|</span>}
        </span>
    );
}

// ===== Trend Badge Component =====
export function TrendBadge({ value, suffix = '%' }) {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    return (
        <span className={`trend-badge ${isPositive ? 'up' : isNeutral ? 'neutral' : 'down'}`}>
            <i className={`bi ${isPositive ? 'bi-arrow-up-right' : isNeutral ? 'bi-dash' : 'bi-arrow-down-right'}`} />
            <span>{Math.abs(value)}{suffix}</span>
        </span>
    );
}

// ===== Shimmer Skeleton Component =====
export function ShimmerBox({
    width = '100%',
    height = 20,
    borderRadius = 8,
    className = ''
}) {
    return (
        <div
            className={`animate-shimmer ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-card-hover) 50%, var(--bg-hover) 75%)',
                backgroundSize: '200% 100%'
            }}
        />
    );
}

// ===== Particles Background Component =====
export function ParticlesBackground({ count = 20 }) {
    const particles = Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 3
    }));

    return (
        <div className="hero-particles">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="hero-particle"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: p.size,
                        height: p.size,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`
                    }}
                />
            ))}
        </div>
    );
}

// ===== Weather Widget Component =====
export function WeatherWidget({ className = '' }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState(() => {
        return localStorage.getItem('weather_location') || 'Cairo,EG';
    });
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const fetchWeatherData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const API_KEY = '8b17866499c90b00762849172880a11f';
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=metric&lang=ar`
            );

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            const mainCondition = data.weather[0]?.main || 'Clear';
            const visibility = data.visibility || 10000;

            const ICONS = { 'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️', 'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️', 'Haze': '🌫️' };
            const DESC_AR = { 'Clear': 'صافي', 'Clouds': 'غائم', 'Rain': 'ممطر', 'Mist': 'شبورة', 'Fog': 'ضباب', 'Haze': 'ضباب خفيف' };

            // Visibility status
            let visStatus;
            if (visibility < 200) visStatus = { text: 'رؤية ضعيفة جداً ⚠️', color: '#ef4444' };
            else if (visibility < 1000) visStatus = { text: 'رؤية ضعيفة', color: '#f97316' };
            else if (visibility < 4000) visStatus = { text: 'رؤية متوسطة', color: '#eab308' };
            else visStatus = { text: 'رؤية جيدة', color: '#22c55e' };

            setWeather({
                temp: Math.round(data.main.temp),
                humidity: data.main.humidity,
                icon: ICONS[mainCondition] || '🌡️',
                description: DESC_AR[mainCondition] || data.weather[0]?.description,
                visibility: visibility,
                visibilityKm: (visibility / 1000).toFixed(1),
                visibilityStatus: visStatus,
                cityName: data.name,
                isFoggy: ['Mist', 'Fog', 'Haze'].includes(mainCondition),
            });
        } catch (err) {
            setError('تعذر تحميل الطقس');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [location]);

    useEffect(() => {
        fetchWeatherData();
        const interval = setInterval(fetchWeatherData, 10 * 60 * 1000); // Refresh every 10 mins
        return () => clearInterval(interval);
    }, [fetchWeatherData]);

    const handleLocationChange = (newLocation) => {
        localStorage.setItem('weather_location', newLocation);
        setLocation(newLocation);
        setShowLocationPicker(false);
    };

    if (loading) {
        return (
            <div className={`weather-widget flex items-center gap-2 ${className}`}>
                <div className="animate-pulse bg-white/20 rounded-full w-8 h-8"></div>
                <div className="animate-pulse bg-white/20 rounded h-4 w-16"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`weather-widget flex items-center gap-2 text-white/70 ${className}`}>
                <span>⚠️</span>
                <span className="text-xs">{error}</span>
            </div>
        );
    }

    if (!weather) return null;

    return (
        <div className="relative">
            {/* Main Weather Widget - Clickable */}
            <div
                className={`weather-widget-enhanced flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg px-2 py-1 transition-all ${className}`}
                onClick={() => setExpanded(!expanded)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
            >
                <span className="weather-icon text-2xl">{weather.icon}</span>
                <div className="text-white">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{weather.temp}°C</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowLocationPicker(true); }}
                            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-all"
                            title="تغيير الموقع"
                        >
                            📍 {weather.cityName}
                        </button>
                    </div>
                    <div className="text-xs text-white/70">{weather.description}</div>
                </div>

                {/* Fog/Visibility Warning Badge */}
                {weather.isFoggy && (
                    <div className="fog-warning bg-amber-500/90 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                        🌫️ شبورة
                    </div>
                )}

                {/* Expand indicator */}
                <span className={`text-white/60 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </div>

            {/* Expanded Weather Details */}
            {expanded && (
                <div
                    className="weather-details absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 backdrop-blur-md rounded-xl shadow-2xl p-4 min-w-[250px] z-[100] border border-gray-200 dark:border-gray-700"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <span className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">{weather.icon}</span>
                            {weather.temp}°C
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{weather.cityName}</span>
                    </div>

                    {/* Visibility Status */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">👁️ الرؤية:</span>
                        <span
                            className="font-medium text-sm px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: weather.visibilityStatus.color + '20', color: weather.visibilityStatus.color }}
                        >
                            {weather.visibilityKm} كم
                        </span>
                    </div>

                    <div
                        className="text-xs px-2 py-1 rounded-lg text-center font-medium mb-2"
                        style={{ backgroundColor: weather.visibilityStatus.color + '20', color: weather.visibilityStatus.color }}
                    >
                        {weather.visibilityStatus.text}
                    </div>

                    {/* Humidity */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>💧 الرطوبة:</span>
                        <span className="font-medium">{weather.humidity}%</span>
                    </div>

                    {/* Close hint */}
                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-center">
                        <span className="text-xs text-gray-400">اضغط مرة أخرى للإغلاق</span>
                    </div>
                </div>
            )}

            {/* Location Picker Modal */}
            {showLocationPicker && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowLocationPicker(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">📍 اختر موقعك</h3>
                                <button onClick={() => setShowLocationPicker(false)} className="p-1 hover:bg-white/20 rounded-full">✕</button>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2">
                            {[
                                { name: 'القاهرة', value: 'Cairo,EG' },
                                { name: 'الإسكندرية', value: 'Alexandria,EG' },
                                { name: 'الجيزة', value: 'Giza,EG' },
                                { name: 'المنصورة', value: 'Mansoura,EG' },
                                { name: 'طنطا', value: 'Tanta,EG' },
                                { name: 'الزقازيق', value: 'Zagazig,EG' },
                                { name: 'كفر الشيخ', value: 'Kafr el-Sheikh,EG' },
                                { name: 'دمنهور', value: 'Damanhur,EG' },
                                { name: 'بنها', value: 'Benha,EG' },
                                { name: 'شبين الكوم', value: 'Shibin El Kom,EG' },
                                { name: 'المنيا', value: 'Minya,EG' },
                                { name: 'أسيوط', value: 'Asyut,EG' },
                                { name: 'الأقصر', value: 'Luxor,EG' },
                                { name: 'أسوان', value: 'Aswan,EG' },
                                { name: 'الإسماعيلية', value: 'Ismailia,EG' },
                                { name: 'بورسعيد', value: 'Port Said,EG' },
                                { name: 'السويس', value: 'Suez,EG' },
                            ].map((city) => (
                                <button
                                    key={city.value}
                                    onClick={() => handleLocationChange(city.value)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all
                                              hover:bg-emerald-50 dark:hover:bg-emerald-900/30
                                              ${location === city.value ? 'bg-emerald-100 dark:bg-emerald-900/50' : ''}`}
                                >
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center
                                                  ${location === city.value ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        {location === city.value ? '✓' : '📍'}
                                    </span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{city.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== Real Time Clock Component =====
export function RealTimeClock({ className = '' }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('ar-EG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    return (
        <div className={`text-white text-left ${className}`}>
            <div className="text-2xl font-bold tabular-nums">{formatTime(time)}</div>
            <div className="text-sm text-white/70">{formatDate(time)}</div>
        </div>
    );
}

export default {
    CountUp,
    Sparkline,
    ProgressRing,
    FloatingElement,
    AnimatedIcon,
    RippleButton,
    TypingText,
    TrendBadge,
    ShimmerBox,
    ParticlesBackground,
    WeatherWidget,
    RealTimeClock
};
