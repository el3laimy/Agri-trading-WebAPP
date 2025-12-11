import React, { useState, useEffect } from 'react';
import { getCashFlowReport, getCashFlowDetails } from '../api/reports';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function CashFlowReport() {
    const [report, setReport] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const start = startDate.toISOString().slice(0, 10);
            const end = endDate.toISOString().slice(0, 10);

            const [reportData, detailsData] = await Promise.all([
                getCashFlowReport(start, end),
                getCashFlowDetails(start, end)
            ]);

            setReport(reportData);
            setDetails(detailsData);
        } catch (error) {
            console.error("Failed to fetch cash flow:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4 align-items-center justify-content-between">
                <div className="col-md-6">
                    <h2 className="fw-bold mb-0" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-arrow-left-right me-2"></i>
                        تقرير التدفقات النقدية
                    </h2>
                    <p className="text-muted mb-0">مصادر واستخدامات النقدية</p>
                </div>
                <div className="col-md-6 d-flex justify-content-end gap-2 flex-wrap">
                    <div className="d-flex align-items-center gap-2 bg-white p-2 rounded shadow-sm">
                        <span className="text-muted small">من:</span>
                        <DatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            className="form-control form-control-sm border-0"
                            dateFormat="yyyy-MM-dd"
                        />
                        <span className="text-muted small">إلى:</span>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="form-control form-control-sm border-0"
                            dateFormat="yyyy-MM-dd"
                        />
                        <button className="btn btn-primary btn-sm" onClick={fetchReport}>
                            <i className="bi bi-search"></i>
                        </button>
                    </div>
                    <button className="btn btn-outline-secondary" onClick={handlePrint}>
                        <i className="bi bi-printer me-1"></i>
                        طباعة
                    </button>
                </div>
            </div>

            {report && (
                <>
                    {/* Summary Cards */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                    <small className="text-muted">رصيد البداية</small>
                                    <h4 className="fw-bold text-secondary">{formatCurrency(report.opening_balance)}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderTop: '3px solid #28A745' }}>
                                <div className="card-body text-center">
                                    <small className="text-muted">صافي التدفق التشغيلي</small>
                                    <h4 className={`fw-bold ${report.operating_activities.net_operating_cash_flow >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(report.operating_activities.net_operating_cash_flow)}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100" style={{ borderTop: '3px solid #17A2B8' }}>
                                <div className="card-body text-center">
                                    <small className="text-muted">صافي التغير</small>
                                    <h4 className={`fw-bold ${report.net_cash_change >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(report.net_cash_change)}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100 text-white" style={{ background: 'linear-gradient(135deg, #1E5631 0%, #3D8B4F 100%)' }}>
                                <div className="card-body text-center">
                                    <small className="text-white-50">رصيد الإغلاق</small>
                                    <h4 className="fw-bold">{formatCurrency(report.closing_balance)}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cash Flow Statement */}
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white py-3">
                                    <h5 className="mb-0 fw-bold">
                                        <i className="bi bi-file-text me-2 text-primary"></i>
                                        قائمة التدفقات النقدية
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {/* Operating Activities */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                                            <i className="bi bi-gear me-2"></i>
                                            التدفقات من الأنشطة التشغيلية
                                        </h6>
                                        <table className="table table-sm mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="ps-4">تحصيلات من العملاء</td>
                                                    <td className="text-end text-success">
                                                        +{formatCurrency(report.operating_activities.customer_collections)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">مدفوعات للموردين</td>
                                                    <td className="text-end text-danger">
                                                        -{formatCurrency(report.operating_activities.supplier_payments)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">مصروفات تشغيلية</td>
                                                    <td className="text-end text-danger">
                                                        -{formatCurrency(report.operating_activities.operating_expenses)}
                                                    </td>
                                                </tr>
                                                <tr className="fw-bold" style={{ backgroundColor: '#f8f9fa' }}>
                                                    <td>صافي التدفقات التشغيلية</td>
                                                    <td className={`text-end ${report.operating_activities.net_operating_cash_flow >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {formatCurrency(report.operating_activities.net_operating_cash_flow)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Investing Activities */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-info border-bottom pb-2 mb-3">
                                            <i className="bi bi-building me-2"></i>
                                            التدفقات من الأنشطة الاستثمارية
                                        </h6>
                                        <table className="table table-sm mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="ps-4">إيرادات استثمارية</td>
                                                    <td className="text-end text-success">
                                                        +{formatCurrency(report.investing_activities.inflows)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">مصروفات رأسمالية</td>
                                                    <td className="text-end text-danger">
                                                        -{formatCurrency(report.investing_activities.outflows)}
                                                    </td>
                                                </tr>
                                                <tr className="fw-bold" style={{ backgroundColor: '#f8f9fa' }}>
                                                    <td>صافي التدفقات الاستثمارية</td>
                                                    <td className={`text-end ${report.investing_activities.net_investing_cash_flow >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {formatCurrency(report.investing_activities.net_investing_cash_flow)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Financing Activities */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-warning border-bottom pb-2 mb-3">
                                            <i className="bi bi-bank me-2"></i>
                                            التدفقات من الأنشطة التمويلية
                                        </h6>
                                        <table className="table table-sm mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="ps-4">مساهمات رأس المال</td>
                                                    <td className="text-end text-success">
                                                        +{formatCurrency(report.financing_activities.capital_contributions)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="ps-4">سحوبات رأس المال</td>
                                                    <td className="text-end text-danger">
                                                        -{formatCurrency(report.financing_activities.capital_withdrawals)}
                                                    </td>
                                                </tr>
                                                <tr className="fw-bold" style={{ backgroundColor: '#f8f9fa' }}>
                                                    <td>صافي التدفقات التمويلية</td>
                                                    <td className={`text-end ${report.financing_activities.net_financing_cash_flow >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {formatCurrency(report.financing_activities.net_financing_cash_flow)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary */}
                                    <div className="border-top pt-3">
                                        <table className="table table-sm mb-0">
                                            <tbody>
                                                <tr className="fw-bold fs-6">
                                                    <td>صافي التغير في النقدية</td>
                                                    <td className={`text-end ${report.net_cash_change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {formatCurrency(report.net_cash_change)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>رصيد البداية</td>
                                                    <td className="text-end">{formatCurrency(report.opening_balance)}</td>
                                                </tr>
                                                <tr className="fw-bold fs-5 table-success">
                                                    <td>رصيد الإغلاق</td>
                                                    <td className="text-end">{formatCurrency(report.closing_balance)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white py-3">
                                    <h6 className="mb-0 fw-bold">
                                        <i className="bi bi-list-ul me-2"></i>
                                        آخر الحركات
                                    </h6>
                                </div>
                                <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {details.length > 0 ? (
                                        <ul className="list-group list-group-flush">
                                            {details.slice(0, 20).map((item, index) => (
                                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-2">
                                                    <div>
                                                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(item.date).toLocaleDateString('ar-EG')}
                                                        </small>
                                                        <span style={{ fontSize: '0.85rem' }}>{item.description}</span>
                                                    </div>
                                                    <span className={`badge ${item.flow_type === 'IN' ? 'bg-success' : 'bg-danger'}`}>
                                                        {item.flow_type === 'IN' ? '+' : '-'}{formatCurrency(item.amount)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center text-muted py-4">
                                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                            لا توجد حركات
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default CashFlowReport;
