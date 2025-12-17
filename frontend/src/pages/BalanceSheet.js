import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, Card } from '../components/common';
import { formatCurrency } from '../utils';

const BalanceSheet = () => {
    const [reportData, setReportData] = useState(null);
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
            const dateStr = endDate.toISOString().split('T')[0];
            const response = await fetch(`http://localhost:8000/api/v1/reports/balance-sheet?end_date=${dateStr}`);

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
                title="الميزانية العمومية"
                subtitle="تقرير المركز المالي (الأصول، الخصوم، وحقوق الملكية)"
                icon="bi-bank"
            />

            {/* Filter Card */}
            <Card className="mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-md-6">
                        <label className="form-label fw-bold">الميزانية في تاريخ</label>
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="col-md-6 d-flex gap-2">
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

            {isLoading && <PageLoading text="جاري إعداد الميزانية العمومية..." />}

            {reportData && !isLoading && (
                <div className="card border-0 shadow-lg print-section">
                    <div className="card-header bg-white text-center py-4 border-bottom">
                        <h3 className="fw-bold text-primary mb-2">الميزانية العمومية</h3>
                        <p className="text-muted mb-0">كما في {reportData.end_date}</p>
                    </div>
                    <div className="card-body p-4">
                        <div className="row g-4">
                            {/* Assets Column */}
                            <div className="col-md-6">
                                <div className="card h-100 border shadow-sm">
                                    <div className="card-header bg-success text-white py-3">
                                        <h5 className="mb-0 fw-bold text-center">الأصول</h5>
                                    </div>
                                    <div className="card-body">
                                        <table className="table table-hover mb-0">
                                            <tbody>
                                                {reportData.assets.map((item, index) => (
                                                    <tr key={`asset-${index}`}>
                                                        <td>{item.account_name}</td>
                                                        <td className="text-end fw-medium">{formatCurrency(item.balance)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="card-footer bg-light fw-bold fs-5 d-flex justify-content-between">
                                        <span>إجمالي الأصول</span>
                                        <span className="text-success">{formatCurrency(reportData.total_assets)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Liabilities & Equity Column */}
                            <div className="col-md-6">
                                <div className="d-flex flex-column h-100 gap-4">
                                    {/* Liabilities */}
                                    <div className="card border shadow-sm flex-grow-1">
                                        <div className="card-header bg-warning text-dark py-3">
                                            <h5 className="mb-0 fw-bold text-center">الخصوم (الالتزامات)</h5>
                                        </div>
                                        <div className="card-body">
                                            <table className="table table-hover mb-0">
                                                <tbody>
                                                    {reportData.liabilities.map((item, index) => (
                                                        <tr key={`lia-${index}`}>
                                                            <td>{item.account_name}</td>
                                                            <td className="text-end fw-medium">{formatCurrency(item.balance)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="card-footer bg-light fw-bold d-flex justify-content-between">
                                            <span>إجمالي الخصوم</span>
                                            <span>{formatCurrency(reportData.total_liabilities)}</span>
                                        </div>
                                    </div>

                                    {/* Equity */}
                                    <div className="card border shadow-sm flex-grow-1">
                                        <div className="card-header bg-info text-white py-3">
                                            <h5 className="mb-0 fw-bold text-center">حقوق الملكية</h5>
                                        </div>
                                        <div className="card-body">
                                            <table className="table table-hover mb-0">
                                                <tbody>
                                                    {reportData.equity.map((item, index) => (
                                                        <tr key={`eq-${index}`}>
                                                            <td>{item.account_name}</td>
                                                            <td className="text-end fw-medium">{formatCurrency(item.balance)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="card-footer bg-light fw-bold d-flex justify-content-between">
                                            <span>إجمالي حقوق الملكية</span>
                                            <span>{formatCurrency(reportData.total_equity)}</span>
                                        </div>
                                    </div>

                                    {/* Total Liabilities + Equity */}
                                    <div className="alert alert-secondary d-flex justify-content-between align-items-center fw-bold fs-5 mb-0 shadow-sm">
                                        <span>إجمالي الخصوم وحقوق الملكية</span>
                                        <span>{formatCurrency(reportData.total_liabilities_and_equity)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceSheet;
