import React from 'react';

/**
 * Loading spinner component
 */
export function LoadingSpinner({ size = 'md', color = 'primary', text = null }) {
    const sizeClasses = {
        sm: 'spinner-border-sm',
        md: '',
        lg: { width: '3rem', height: '3rem' }
    };

    const spinnerStyle = size === 'lg' ? sizeClasses.lg : {};

    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-4">
            <div
                className={`spinner-border text-${color} ${sizeClasses[size] || ''}`}
                style={spinnerStyle}
                role="status"
            >
                <span className="visually-hidden">جاري التحميل...</span>
            </div>
            {text && <p className="text-muted mt-3 mb-0">{text}</p>}
        </div>
    );
}

/**
 * Full page loading overlay
 */
export function PageLoading({ text = 'جاري التحميل...' }) {
    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <LoadingSpinner size="lg" text={text} />
        </div>
    );
}

/**
 * Inline loading spinner for buttons
 */
export function ButtonSpinner() {
    return (
        <span className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">جاري التحميل...</span>
        </span>
    );
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton({ width = '100%', height = '1rem', className = '', rounded = false }) {
    return (
        <div
            className={`placeholder-glow ${className}`}
            style={{ width }}
        >
            <span
                className={`placeholder bg-secondary ${rounded ? 'rounded' : ''}`}
                style={{ width: '100%', height, display: 'block' }}
            ></span>
        </div>
    );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton({ lines = 3 }) {
    return (
        <div className="card border-0 shadow-sm">
            <div className="card-body">
                <Skeleton width="60%" height="1.5rem" className="mb-3" />
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton key={i} width={`${100 - i * 15}%`} className="mb-2" />
                ))}
            </div>
        </div>
    );
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
    return (
        <div className="table-responsive">
            <table className="table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}><Skeleton width="80%" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIdx) => (
                        <tr key={rowIdx}>
                            {Array.from({ length: columns }).map((_, colIdx) => (
                                <td key={colIdx}><Skeleton width={`${70 + Math.random() * 30}%`} /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default LoadingSpinner;
