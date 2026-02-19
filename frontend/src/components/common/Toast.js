import React, { useState, useEffect, useCallback } from 'react';

/**
 * Enhanced Toast notification component
 * Features: Smooth animations, progress bar, stacking support, Tailwind CSS
 */
function Toast({ message, type = 'success', onClose, duration = 4000 }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [progress, setProgress] = useState(100);

    // Animation on mount
    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        // Progress bar countdown
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
        }, 50);

        // Auto-dismiss timer
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [duration]);

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose();
        }, 300);
    }, [onClose]);

    const config = {
        success: {
            icon: 'bi-check-circle-fill',
            bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
            progressBg: 'bg-emerald-300/50',
            iconBg: 'bg-emerald-400/30',
        },
        error: {
            icon: 'bi-x-circle-fill',
            bg: 'bg-gradient-to-r from-rose-500 to-red-500',
            progressBg: 'bg-rose-300/50',
            iconBg: 'bg-rose-400/30',
        },
        warning: {
            icon: 'bi-exclamation-triangle-fill',
            bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
            progressBg: 'bg-amber-300/50',
            iconBg: 'bg-amber-400/30',
        },
        info: {
            icon: 'bi-info-circle-fill',
            bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
            progressBg: 'bg-blue-300/50',
            iconBg: 'bg-blue-400/30',
        }
    };

    const { icon, bg, progressBg, iconBg } = config[type] || config.success;

    return (
        <div
            className={`
                fixed z-[9999] pointer-events-auto
                min-w-[280px] sm:min-w-[320px] max-w-[420px]
                ${bg} text-white
                rounded-xl shadow-2xl
                overflow-hidden
                transform transition-all duration-300 ease-out
                ${isVisible && !isLeaving
                    ? 'translate-x-0 opacity-100 scale-100'
                    : 'translate-x-full opacity-0 scale-95'}
            `}
            role="alert"
            dir="rtl"
        >
            {/* Main content */}
            <div className="flex items-center gap-3 p-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}>
                    <i className={`bi ${icon} text-xl`}></i>
                </div>

                {/* Message */}
                <p className="flex-1 text-sm font-medium leading-relaxed">
                    {message}
                </p>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 
                               flex items-center justify-center transition-colors duration-200
                               focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="إغلاق"
                >
                    <i className="bi bi-x text-lg"></i>
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-black/10">
                <div
                    className={`h-full ${progressBg} transition-all duration-100 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Enhanced Toast container with stacking support
 */
export function ToastContainer({ toasts, removeToast }) {
    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
            aria-live="polite"
            aria-label="الإشعارات"
        >
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

/**
 * Custom hook for managing toasts
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) =>
        addToast(message, 'success', duration), [addToast]);

    const showError = useCallback((message, duration) =>
        addToast(message, 'error', duration || 5000), [addToast]); // Errors show longer

    const showWarning = useCallback((message, duration) =>
        addToast(message, 'warning', duration), [addToast]);

    const showInfo = useCallback((message, duration) =>
        addToast(message, 'info', duration), [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
}

export default Toast;
