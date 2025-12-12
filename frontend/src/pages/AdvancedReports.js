import React, { useState, useEffect } from 'react';
import { getCropProfitability, getTopCustomers, getDebtAnalysis } from '../api/reports';
import { useData } from '../context/DataContext';

function AdvancedReports() {
    const { seasons } = useData();
    const [selectedSeason, setSelectedSeason] = useState('');
    const [profitability, setProfitability] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [debtData, setDebtData] = useState({ receivables: [], payables: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [selectedSeason]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profitData, customersData, debt] = await Promise.all([
                getCropProfitability(selectedSeason),
                getTopCustomers(5),
                getDebtAnalysis()
            ]);
            setProfitability(profitData);
            setTopCustomers(customersData);
            setDebtData(debt);
        } catch (error) {
            console.error("Error loading reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
    };

    if (loading) return <div className="text-center py-5">جاري تحميل التقارير...</div>;

    return (
        <div className="container-fluid fade-in">
            <div className="row mb-4 align-items-center">
                <div className="col">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-bar-chart-line me-2"></i>
                        التقارير المتقدمة
                    </h2>
                    <p className="text-muted">تحليلات تفصيلية للأداء المالي والتشغيلي</p>
                </div>
                <div className="col-auto">
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

            {/* صف واحد: ربحية المحاصيل + أفضل العملاء */}
            <div className="row g-4 mb-4">
                {/* ربحية المحاصيل */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold">ربحية المحاصيل</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>المحصول</th>
                                            <th>الإيرادات</th>
                                            <th>التكاليف (تقديري)</th>
                                            <th>الربح</th>
                                            <th>الهامش</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profitability.map((p, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-bold">{p.crop_name}</td>
                                                <td className="text-success">{formatCurrency(p.revenue)}</td>
                                                <td className="text-danger">{formatCurrency(p.cost)}</td>
                                                <td className={`fw-bold ${p.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {formatCurrency(p.profit)}
                                                </td>
                                                <td>
                                                    <span className={`badge ${p.margin >= 20 ? 'bg-success' : p.margin > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                        {p.margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* أفضل العملاء */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-bold">أفضل العملاء (Top 5)</h5>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                {topCustomers.map((c, idx) => (
                                    <li key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                        <div>
                                            <div className="fw-bold">{c.name}</div>
                                            <small className="text-muted">{c.transaction_count} عملية</small>
                                        </div>
                                        <div className="fw-bold text-primary">{formatCurrency(c.total_sales)}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* صف الديون: ديون لنا + ديون علينا */}
            <div className="row g-4">
                {/* ديون العملاء (لنا) */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-danger text-white py-3">
                            <h5 className="mb-0 fw-bold">ديون العملاء (مستحقات لنا)</h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                <table className="table table-striped mb-0">
                                    <thead>
                                        <tr>
                                            <th>العميل</th>
                                            <th>هاتف</th>
                                            <th>المبلغ المستحق</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {debtData.receivables.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center py-3">لا توجد ديون مستحقة</td></tr>
                                        ) : (
                                            debtData.receivables.map((r, idx) => (
                                                <tr key={idx}>
                                                    <td>{r.name}</td>
                                                    <td>{r.phone || '-'}</td>
                                                    <td className="fw-bold text-danger">{formatCurrency(r.balance_due)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ديون الموردين (علينا) */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-warning text-dark py-3">
                            <h5 className="mb-0 fw-bold">ديون الموردين (التزامات علينا)</h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                <table className="table table-striped mb-0">
                                    <thead>
                                        <tr>
                                            <th>المورد</th>
                                            <th>هاتف</th>
                                            <th>المبلغ المستحق</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {debtData.payables.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center py-3">لا توجد التزامات</td></tr>
                                        ) : (
                                            debtData.payables.map((p, idx) => (
                                                <tr key={idx}>
                                                    <td>{p.name}</td>
                                                    <td>{p.phone || '-'}</td>
                                                    <td className="fw-bold text-danger">{formatCurrency(p.balance_due)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdvancedReports;
