import React from 'react';

/**
 * Component for treasury KPI cards display
 */
function TreasuryKPICards({ summary, formatCurrency }) {
    if (!summary) return null;

    return (
        <div className="row mb-4">
            {/* Opening Balance */}
            <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm h-100 kpi-card bg-light">
                    <div className="card-body">
                        <small className="text-muted d-block mb-2">رصيد البداية</small>
                        <h4 className="fw-bold text-secondary mb-0">{formatCurrency(summary.opening_balance)}</h4>
                    </div>
                </div>
            </div>

            {/* Inflow (+ sign) */}
            <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm h-100 kpi-card" style={{ borderRight: '4px solid #198754' }}>
                    <div className="card-body">
                        <small className="text-muted d-block mb-2">
                            <i className="bi bi-plus-lg text-success me-1"></i>
                            مقبوضات اليوم
                        </small>
                        <h4 className="fw-bold text-success mb-0">{formatCurrency(summary.total_in_today)}</h4>
                    </div>
                </div>
            </div>

            {/* Outflow (- sign) */}
            <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm h-100 kpi-card" style={{ borderRight: '4px solid #dc3545' }}>
                    <div className="card-body">
                        <small className="text-muted d-block mb-2">
                            <i className="bi bi-dash-lg text-danger me-1"></i>
                            مدفوعات اليوم
                        </small>
                        <h4 className="fw-bold text-danger mb-0">{formatCurrency(summary.total_out_today)}</h4>
                    </div>
                </div>
            </div>

            {/* Closing Balance (= sign) */}
            <div className="col-md-3 mb-3">
                <div className="card border-0 shadow-sm h-100 kpi-card text-white" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #0D3320 100%)' }}>
                    <div className="card-body">
                        <small className="text-white-50 d-block mb-2">
                            <i className="bi bi-equals me-1"></i>
                            رصيد الإغلاق
                        </small>
                        <h4 className="fw-bold mb-0">{formatCurrency(summary.closing_balance)}</h4>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TreasuryKPICards;
