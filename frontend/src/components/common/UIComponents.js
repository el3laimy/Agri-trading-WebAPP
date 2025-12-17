import React from 'react';

/**
 * Page header component
 */
export function PageHeader({ icon, title, subtitle }) {
    return (
        <div className="row mb-4">
            <div className="col-12">
                <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                    {icon && <i className={`bi ${icon} me-2`}></i>}
                    {title}
                </h2>
                {subtitle && <p className="text-muted">{subtitle}</p>}
            </div>
        </div>
    );
}

/**
 * Search input component
 */
export function SearchInput({ value, onChange, placeholder = 'بحث...' }) {
    return (
        <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search"></i>
            </span>
            <input
                type="text"
                className="form-control border-start-0 search-box"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

/**
 * Add button component
 */
export function AddButton({ isOpen, onClick, openText = 'إلغاء', closedText = 'إضافة جديد' }) {
    return (
        <button
            className="btn btn-primary btn-lg"
            onClick={onClick}
        >
            <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
            {isOpen ? openText : closedText}
        </button>
    );
}

/**
 * Card wrapper component
 */
export function Card({ title, icon, children, headerActions, className = '' }) {
    return (
        <div className={`card border-0 shadow-sm ${className}`}>
            {(title || headerActions) && (
                <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        {icon && <i className={`bi ${icon} me-2`}></i>}
                        {title}
                    </h5>
                    {headerActions}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </div>
    );
}

/**
 * Status badge component
 */
export function StatusBadge({ status, labels = {} }) {
    const defaultLabels = {
        PAID: { text: 'مدفوع', className: 'bg-success' },
        PARTIAL: { text: 'جزئي', className: 'bg-warning text-dark' },
        PENDING: { text: 'معلق', className: 'bg-danger' },
        ACTIVE: { text: 'نشط', className: 'bg-success' },
        INACTIVE: { text: 'غير نشط', className: 'bg-secondary' },
        ...labels
    };

    const config = defaultLabels[status] || { text: status, className: 'bg-secondary' };

    return (
        <span className={`badge ${config.className}`}>
            {config.text}
        </span>
    );
}

export default PageHeader;
