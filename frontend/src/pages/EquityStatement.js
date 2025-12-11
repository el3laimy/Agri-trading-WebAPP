import React, { useState } from 'react';

const EquityStatement = () => {
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
            const response = await fetch(`http://localhost:8000/api/v1/reports/equity-statement?start_date=${startDate}&end_date=${endDate}`);
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
            <h1>Statement of Owner's Equity</h1>
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
                        <h2>Statement of Owner's Equity</h2>
                        <p className="mb-0">For the period from {reportData.start_date} to {reportData.end_date}</p>
                    </div>
                    <div className="card-body">
                        <table className="table table-bordered">
                            <tbody>
                                <tr>
                                    <td>Beginning Equity</td>
                                    <td className="text-end">{renderMoney(reportData.beginning_equity)}</td>
                                </tr>
                                <tr>
                                    <td>Net Income</td>
                                    <td className="text-end">{renderMoney(reportData.net_income)}</td>
                                </tr>
                                <tr>
                                    <td>Owner Contributions</td>
                                    <td className="text-end">{renderMoney(reportData.owner_contributions)}</td>
                                </tr>
                                <tr>
                                    <td>Owner Draws</td>
                                    <td className="text-end text-danger">({renderMoney(reportData.owner_draws)})</td>
                                </tr>
                                <tr className="fw-bold table-light">
                                    <td>Ending Equity</td>
                                    <td className="text-end">{renderMoney(reportData.ending_equity)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquityStatement;
