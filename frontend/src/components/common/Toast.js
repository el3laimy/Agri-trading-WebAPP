import React, { useState, useEffect } from 'react';

/**
 * Toast notification component for success/error messages
 */
function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return 'bi-check-circle-fill';
            case 'error': return 'bi-x-circle-fill';
            case 'warning': return 'bi-exclamation-triangle-fill';
            case 'info': return 'bi-info-circle-fill';
            default: return 'bi-check-circle-fill';
        }
    };

    const getStyle = () => {
        const baseStyle = {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: `translateX(-50%) translateY(${show ? '0' : '-100px'})`,
            zIndex: 9999,
            minWidth: '300px',
            maxWidth: '90%',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s ease',
            opacity: show ? 1 : 0
        };

        const colors = {
            success: { background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' },
            error: { background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', color: 'white' },
            warning: { background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', color: '#333' },
            info: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }
        };

        return { ...baseStyle, ...colors[type] };
    };

    return (
        <div style={getStyle()}>
            <i className={`bi ${getIcon()} fs-4`}></i>
            <span className="fw-bold flex-grow-1">{message}</span>
            <button
                onClick={() => { setShow(false); setTimeout(onClose, 300); }}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'inherit'
                }}
            >
                <i className="bi bi-x"></i>
            </button>
        </div>
    );
}

/**
 * Toast container to manage multiple toasts
 */
export function ToastContainer({ toasts, removeToast }) {
    return (
        <>
            {toasts.map((toast, index) => (
                <div key={toast.id} style={{ marginTop: index * 70 + 'px' }}>
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                </div>
            ))}
        </>
    );
}

/**
 * Custom hook for managing toasts
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const showSuccess = (message) => addToast(message, 'success');
    const showError = (message) => addToast(message, 'error');
    const showWarning = (message) => addToast(message, 'warning');
    const showInfo = (message) => addToast(message, 'info');

    return { toasts, addToast, removeToast, showSuccess, showError, showWarning, showInfo };
}

export default Toast;
