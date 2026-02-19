import React from 'react';

/**
 * Alert Toast component for success and error messages
 */
function AlertToast({ type = 'success', message, onClose }) {
    if (!message) return null;

    const config = {
        success: {
            className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
            icon: 'bi-check-circle-fill text-emerald-600 dark:text-emerald-400'
        },
        error: {
            className: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
            icon: 'bi-exclamation-triangle-fill text-red-600 dark:text-red-400'
        },
        warning: {
            className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
            icon: 'bi-exclamation-circle-fill text-amber-600 dark:text-amber-400'
        },
        info: {
            className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
            icon: 'bi-info-circle-fill text-blue-600 dark:text-blue-400'
        }
    };

    const { className, icon } = config[type] || config.info;

    return (
        <div className={`p-4 mb-4 rounded-xl border flex items-start ${className} lg-animate-fade`} role="alert">
            <i className={`bi ${icon} text-xl me-3 mt-0.5`}></i>
            <div className="flex-1 font-medium">
                {message}
            </div>
            {onClose && (
                <button
                    type="button"
                    className="ms-3 -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 opacity-50 hover:opacity-100 transition-opacity"
                    onClick={onClose}
                >
                    <i className="bi bi-x text-xl"></i>
                </button>
            )}
        </div>
    );
}

/**
 * Success alert
 */
export function SuccessAlert({ message, onClose }) {
    return <AlertToast type="success" message={message} onClose={onClose} />;
}

/**
 * Error alert
 */
export function ErrorAlert({ message, onClose }) {
    return <AlertToast type="error" message={message} onClose={onClose} />;
}

/**
 * Warning alert
 */
export function WarningAlert({ message, onClose }) {
    return <AlertToast type="warning" message={message} onClose={onClose} />;
}

/**
 * Combined alerts component for pages
 */
export function PageAlerts({ successMessage, errorMessage, onClearSuccess, onClearError }) {
    return (
        <>
            {successMessage && (
                <SuccessAlert message={successMessage} onClose={onClearSuccess} />
            )}
            {errorMessage && (
                <ErrorAlert message={errorMessage} onClose={onClearError} />
            )}
        </>
    );
}

export default AlertToast;
