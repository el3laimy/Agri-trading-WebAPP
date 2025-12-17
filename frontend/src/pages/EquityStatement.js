import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency } from '../utils';

const EquityStatement = () => {
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1));
    const [endDate, setEndDate] = useState(new Date());

    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError
    } = usePageState();

    const handleGenerateReport = async () => {
        startLoading();
        setReportData(null);

        try {
            const start = startDate.toISOString().split('T')[0];
            const end = endDate.toISOString().split('T')[0];

            const response = await fetch(`http://localhost:8000/api/v1/reports/equity-statement?start_date=${start}&end_date=${end}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate report');
            }
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            console.error(err);
            showError(err.message);
        } finally {
            stopLoading();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container-fluid">
            <PageHeader
                title="بيان حقوق الملكية"
                subtitle="تتبع التغيرات في رأس المال وحقوق الملاك خلال الفترة"
                icon="bi-pie-chart"
            />

            {/* Filter Card */}
            <Card className="mb-4 d-print-none">
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">من تاريخ</label>
                        <DatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">إلى تاريخ</label>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="col-md-4 d-flex gap-2">
                        <button
                            className="btn btn-primary flex-grow-1"
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                        >
                            {isLoading ? 'جاري التحضير...' : 'عرض التقرير'}
                        </button>
                        {reportData && (
                            <button className="btn btn-outline-secondary" onClick={handlePrint} title="طباعة">
                                <i className="bi bi-printer"></i>
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {isLoading && <PageLoading text="جاري إعداد بيان حقوق الملكية..." />}

            {reportData && !isLoading && (
                <div className="card border-0 shadow-lg print-section">
                    <div className="card-header bg-white text-center py-4 border-bottom">
                        <h3 className="fw-bold text-primary mb-2">بيان حقوق الملكية</h3>
                        <p className="text-muted mb-0">للفترة من {reportData.start_date} إلى {reportData.end_date}</p>
                    </div>
                    <div className="card-body p-4">

                        {/* Summary Cards */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <div className="p-3 border rounded bg-light text-center h-100">
                                    <small className="text-muted d-block mb-1">رصيد بداية المدة</small>
                                    <h4 className="fw-bold text-dark mb-0">{formatCurrency(reportData.beginning_equity)}</h4>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className={`p-3 border rounded text-center h-100 ${reportData.net_income >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                                    <small className="text-muted d-block mb-1">صافي نتيجة الأعمال</small>
                                    <h4 className={`fw-bold mb-0 ${reportData.net_income >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(reportData.net_income)}
                                    </h4>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="p-3 border rounded bg-primary-subtle text-center h-100">
                                    <small className="text-muted d-block mb-1">رصيد نهاية المدة</small>
                                    <h4 className="fw-bold text-primary mb-0">{formatCurrency(reportData.ending_equity)}</h4>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="py-3">البيان</th>
                                        <th className="py-3 text-end" style={{ width: '200px' }}>المبلغ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-hourglass-top text-muted me-2"></i>
                                                <strong>رصيد حقوق الملكية (بداية المدة)</strong>
                                            </div>
                                        </td>
                                        <td className="text-end fw-bold">{formatCurrency(reportData.beginning_equity)}</td>
                                    </tr>

                                    {/* Additions Section */}
                                    <tr className="table-group-divider">
                                        <td colSpan="2" className="text-success small fw-bold text-uppercase bg-light">يضاف:</td>
                                    </tr>
                                    <tr>
                                        <td className="ps-4">
                                            مساهمات وإضافات لرأس المال
                                            <small className="d-block text-muted">أموال تم ضخها من قبل الملاك</small>
                                        </td>
                                        <td className="text-end text-success">+{formatCurrency(reportData.owner_contributions)}</td>
                                    </tr>
                                    {reportData.net_income >= 0 && (
                                        <tr>
                                            <td className="ps-4">
                                                صافي الربح للفترة
                                                <small className="d-block text-muted">أرباح النشاط المرحلة</small>
                                            </td>
                                            <td className="text-end text-success">+{formatCurrency(reportData.net_income)}</td>
                                        </tr>
                                    )}

                                    {/* Deductions Section */}
                                    <tr className="table-group-divider">
                                        <td colSpan="2" className="text-danger small fw-bold text-uppercase bg-light">يخصم:</td>
                                    </tr>
                                    <tr>
                                        <td className="ps-4">
                                            المسحوبات الشخصية
                                            <small className="d-block text-muted">مبالغ تم سحبها من قبل الملاك</small>
                                        </td>
                                        <td className="text-end text-danger">({formatCurrency(reportData.owner_draws)})</td>
                                    </tr>
                                    {reportData.net_income < 0 && (
                                        <tr>
                                            <td className="ps-4">
                                                صافي الخسارة للفترة
                                                <small className="d-block text-muted">خسائر النشاط المرحلة</small>
                                            </td>
                                            <td className="text-end text-danger">({formatCurrency(Math.abs(reportData.net_income))})</td>
                                        </tr>
                                    )}

                                    {/* Footer */}
                                    <tr className="table-dark fw-bold fs-5">
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-hourglass-bottom me-2"></i>
                                                رصيد حقوق الملكية (نهاية المدة)
                                            </div>
                                        </td>
                                        <td className="text-end">{formatCurrency(reportData.ending_equity)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Note */}
                        <div className="alert alert-info d-flex align-items-center mt-4 mb-0">
                            <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                            <div>
                                <strong>توضيح:</strong> يعكس هذا التقرير التغير في ثروة الملاك. الزيادة تعني نمو الاستثمار (من الأرباح أو ضخ أموال)، والنقصان يعني تآكل الاستثمار (من الخسائر أو المسحوبات).
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquityStatement;
