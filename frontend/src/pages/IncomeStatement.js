import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency } from '../utils';

const IncomeStatement = () => {
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

            const response = await fetch(`http://localhost:8000/api/v1/reports/income-statement?start_date=${start}&end_date=${end}`);
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
                title="قائمة الدخل"
                subtitle="تقرير الأرباح والخسائر والنتائج التشغيلية"
                icon="bi-graph-up-arrow"
            />

            {/* Filter Card */}
            <Card className="mb-4">
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
                            <button className="btn btn-outline-secondary" onClick={handlePrint}>
                                <i className="bi bi-printer"></i>
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {isLoading && <PageLoading text="جاري إعداد قائمة الدخل..." />}

            {reportData && !isLoading && (
                <div className="card border-0 shadow-lg print-section">
                    <div className="card-header bg-white text-center py-4 border-bottom">
                        <h3 className="fw-bold text-primary mb-2">قائمة الدخل</h3>
                        <p className="text-muted mb-0">للفترة من {reportData.start_date} إلى {reportData.end_date}</p>
                    </div>
                    <div className="card-body p-4">
                        {/* Revenues */}
                        <div className="mb-4">
                            <h5 className="fw-bold text-success border-bottom pb-2 mb-3">
                                <i className="bi bi-arrow-down-circle me-2"></i>الإيرادات
                            </h5>
                            <table className="table table-hover">
                                <tbody>
                                    {reportData.revenues.map((item, index) => (
                                        <tr key={`rev-${index}`}>
                                            <td>{item.account_name}</td>
                                            <td className="text-end fw-medium">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="table-success fw-bold">
                                        <td>إجمالي الإيرادات</td>
                                        <td className="text-end">{formatCurrency(reportData.total_revenue)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Expenses */}
                        <div className="mb-4">
                            <h5 className="fw-bold text-danger border-bottom pb-2 mb-3">
                                <i className="bi bi-arrow-up-circle me-2"></i>المصروفات
                            </h5>
                            <table className="table table-hover">
                                <tbody>
                                    {reportData.expenses.map((item, index) => (
                                        <tr key={`exp-${index}`}>
                                            <td>{item.account_name}</td>
                                            <td className="text-end fw-medium">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="table-danger fw-bold">
                                        <td>إجمالي المصروفات</td>
                                        <td className="text-end">{formatCurrency(reportData.total_expense)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Net Income Summary */}
                        <div className={`alert ${reportData.net_income >= 0 ? 'alert-success' : 'alert-danger'} d-flex justify-content-between align-items-center mt-4 p-4 shadow-sm`}>
                            <div>
                                <h4 className="fw-bold mb-0">صافي الربح / (الخسارة)</h4>
                                <small>الناتج النهائي للعمليات خلال الفترة</small>
                            </div>
                            <h2 className="fw-bold mb-0 display-6">
                                {formatCurrency(reportData.net_income)}
                            </h2>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeStatement;
