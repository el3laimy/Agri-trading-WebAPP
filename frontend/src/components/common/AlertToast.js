import React from 'react';

/**
 * Alert Toast component for success and error messages
 */
function AlertToast({ type = 'success', message, onClose }) {
    if (!message) return null;

    const config = {
        success: {
            className: 'alert-success',
            icon: 'bi-check-circle-fill'
        },
        error: {
            className: 'alert-danger',
            icon: 'bi-exclamation-triangle-fill'
        },
        warning: {
            className: 'alert-warning',
            icon: 'bi-exclamation-circle-fill'
        },
        info: {
            className: 'alert-info',
            icon: 'bi-info-circle-fill'
        }
    };

    const { className, icon } = config[type] || config.info;

    return (
        <div className={`alert ${className} alert-dismissible fade show`} role="alert">
            <i className={`bi ${icon} me-2`}></i>
            {message}
            {onClose && (
                <button type="button" className="btn-close" onClick={onClose}></button>
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
