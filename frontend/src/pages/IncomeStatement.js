import React, { useState } from 'react';

const IncomeStatement = () => {
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReportData(null);

        try {
            const response = await fetch(`http://localhost:8000/api/v1/reports/income-statement?start_date=${startDate}&end_date=${endDate}`);
            if (!response.ok) {
                throw new Error('Failed to generate report');
            }
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="container mt-4">
            <h1>Income Statement</h1>
            <div className="card card-body mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label htmlFor="start_date" className="form-label">Start Date</label>
                        <input type="date" className="form-control" id="start_date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="end_date" className="form-label">End Date</label>
                        <input type="date" className="form-control" id="end_date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-primary w-100" onClick={handleGenerateReport} disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {reportData && (
                <div className="card">
                    <div className="card-header text-center">
                        <h2>Income Statement</h2>
                        <p className="mb-0">For the period from {reportData.start_date} to {reportData.end_date}</p>
                    </div>
                    <div className="card-body">
                        {/* Revenues */}
                        <h4 className="mt-3">Revenues</h4>
                        <table className="table">
                            <tbody>
                                {reportData.revenues.map((item, index) => (
                                    <tr key={`rev-${index}`}>
                                        <td>{item.account_name}</td>
                                        <td className="text-end">{renderMoney(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="table-light fw-bold">
                                    <td>Total Revenue</td>
                                    <td className="text-end">{renderMoney(reportData.total_revenue)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Expenses */}
                        <h4 className="mt-4">Expenses</h4>
                        <table className="table">
                            <tbody>
                                {reportData.expenses.map((item, index) => (
                                    <tr key={`exp-${index}`}>
                                        <td>{item.account_name}</td>
                                        <td className="text-end">{renderMoney(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="table-light fw-bold">
                                    <td>Total Expenses</td>
                                    <td className="text-end">{renderMoney(reportData.total_expense)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* Net Income */}
                        <div className={`d-flex justify-content-between p-3 mt-4 fw-bold ${reportData.net_income >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                            <h5>Net Income</h5>
                            <h5>{renderMoney(reportData.net_income)}</h5>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeStatement;
