import React from 'react';
import { Link } from 'react-router-dom';

function ReportCard({ title, description, icon, to, color = 'primary' }) {
    return (
        <Link to={to} className="text-decoration-none col-md-6 col-lg-4 mb-4">
            <div className="card h-100 border-0 shadow-sm hover-card">
                <div className={`card-body text-center p-4`}>
                    <div className={`rounded-circle bg-${color}-subtle d-inline-flex align-items-center justify-content-center mb-3`}
                        style={{ width: '80px', height: '80px' }}>
                        <i className={`bi ${icon} fs-1 text-${color}`}></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">{title}</h5>
                    <p className="text-muted small mb-0">{description}</p>
                </div>
                <div className="card-footer bg-white border-0 text-center pb-3">
                    <span className={`text-${color} fw-bold small`}>
                        عرض التقرير <i className="bi bi-arrow-left ms-1"></i>
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default ReportCard;
