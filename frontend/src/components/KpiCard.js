import React from 'react';

function KpiCard({ title, value, formatAsCurrency = true, icon = 'bi-graph-up' }) {
    const formattedValue = formatAsCurrency
        ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(value)
        : value;

    return (
        <div className="col-md-3 mb-4">
            <div className="card-modern p-4 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">
                <div className="d-flex justify-content-between align-items-start z-1">
                    <div>
                        <h6 className="text-muted mb-2">{title}</h6>
                        <h3 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>{formattedValue}</h3>
                    </div>
                    <div className="icon-box rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '48px', height: '48px', backgroundColor: 'rgba(46, 125, 50, 0.1)', color: 'var(--primary-color)' }}>
                        <i className={`bi ${icon} fs-4`}></i>
                    </div>
                </div>
                {/* Decorative background circle */}
                <div className="position-absolute rounded-circle"
                    style={{ width: '100px', height: '100px', backgroundColor: 'rgba(46, 125, 50, 0.03)', top: '-20px', left: '-20px', zIndex: 0 }}></div>
            </div>
        </div>
    );
}

export default KpiCard;
