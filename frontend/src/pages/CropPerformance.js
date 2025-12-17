import React, { useState, useEffect } from 'react';
import { getCropProfitability } from '../api/reports';
import { useData } from '../context/DataContext';
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency, formatPercentage } from '../utils';

const CropPerformance = () => {
    const { seasons } = useData();
    const [selectedSeason, setSelectedSeason] = useState('');
    const [profitability, setProfitability] = useState([]);

    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError
    } = usePageState();

    useEffect(() => {
        loadData();
    }, [selectedSeason]);

    const loadData = async () => {
        startLoading();
        try {
            const data = await getCropProfitability(selectedSeason);
            if (Array.isArray(data)) {
                setProfitability(data);
            } else {
                console.error("Invalid data format received:", data);
                setProfitability([]);
            }
        } catch (err) {
            console.error(err);
            showError("فشل تحميل بيانات ربحية المحاصيل.");
            setProfitability([]);
        } finally {
            stopLoading();
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader
                title="أداء المحاصيل"
                subtitle="تحليل الربحية والتكاليف لكل محصول"
                icon="bi-flower1"
            />

            {/* Filter */}
            <Card className="mb-4">
                <div className="row align-items-center">
                    <div className="col-auto">
                        <label className="fw-bold me-2">اختر الموسم:</label>
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                        >
                            <option value="">جميع المواسم</option>
                            {seasons.map(s => (
                                <option key={s.season_id} value={s.season_id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {isLoading ? (
                <PageLoading text="جاري تحليل أداء المحاصيل..." />
            ) : (
                <div className="row g-4">
                    {profitability.map((crop, idx) => (
                        <div key={idx} className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm hover-card">
                                <div className="card-header bg-white py-3 border-bottom-0">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 className="fw-bold mb-1">{crop.crop_name}</h5>
                                            <small className="text-muted">تحليل الأداء المالي</small>
                                        </div>
                                        <div className={`badge rounded-pill ${crop.profit >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} fs-6`}>
                                            {formatPercentage(crop.margin)} هامش
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body pt-0">
                                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                        <span className="text-muted">صافي الربح</span>
                                        <span className={`fw-bold fs-5 ${crop.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {formatCurrency(crop.profit)}
                                        </span>
                                    </div>

                                    <div className="row g-2 text-center">
                                        <div className="col-6">
                                            <div className="border rounded p-2">
                                                <small className="d-block text-muted mb-1">الإيرادات</small>
                                                <span className="fw-bold text-dark">{formatCurrency(crop.revenue)}</span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="border rounded p-2">
                                                <small className="d-block text-muted mb-1">التكاليف</small>
                                                <span className="fw-bold text-danger">{formatCurrency(crop.cost)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar for Margin visual */}
                                    <div className="mt-3">
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div
                                                className={`progress-bar ${crop.profit >= 0 ? 'bg-success' : 'bg-danger'}`}
                                                role="progressbar"
                                                style={{ width: `${Math.min(Math.abs(crop.margin), 100)}%` }}
                                                aria-valuenow={crop.margin}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {profitability.length === 0 && (
                        <div className="col-12 text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <p className="text-muted">لا توجد بيانات متاحة لهذا الموسم</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CropPerformance;
