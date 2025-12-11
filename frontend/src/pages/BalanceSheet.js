import React, { useState } from 'react';

const BalanceSheet = () => {
    const [reportData, setReportData] = useState(null);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setReportData(null);

        try {
            const response = await fetch(`http://localhost:8000/api/v1/reports/balance-sheet?end_date=${endDate}`);
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
            <h1>Balance Sheet</h1>
            <div className="card card-body mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label htmlFor="end_date" className="form-label">As of Date</label>
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
                        <h2>Balance Sheet</h2>
                        <p className="mb-0">As of {reportData.end_date}</p>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {/* Assets */}
                            <div className="col-md-6">
                                <h4 className="text-center">Assets</h4>
                                <hr />
                                <table className="table">
                                    <tbody>
                                        {reportData.assets.map((item, index) => (
                                            <tr key={`asset-${index}`}>
                                                <td>{item.account_name}</td>
                                                <td className="text-end">{renderMoney(item.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-light fw-bold">
                                            <td>Total Assets</td>
                                            <td className="text-end">{renderMoney(reportData.total_assets)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Liabilities and Equity */}
                            <div className="col-md-6">
                                <h4 className="text-center">Liabilities & Equity</h4>
                                <hr />
                                <h5>Liabilities</h5>
                                <table className="table">
                                    <tbody>
                                        {reportData.liabilities.map((item, index) => (
                                            <tr key={`lia-${index}`}>
                                                <td>{item.account_name}</td>
                                                <td className="text-end">{renderMoney(item.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-light fw-bold">
                                            <td>Total Liabilities</td>
                                            <td className="text-end">{renderMoney(reportData.total_liabilities)}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <h5 className="mt-3">Equity</h5>
                                <table className="table">
                                    <tbody>
                                        {reportData.equity.map((item, index) => (
                                            <tr key={`eq-${index}`}>
                                                <td>{item.account_name}</td>
                                                <td className="text-end">{renderMoney(item.balance)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-light fw-bold">
                                            <td>Total Equity</td>
                                            <td className="text-end">{renderMoney(reportData.total_equity)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                                <div className="d-flex justify-content-between p-3 mt-2 fw-bold table-light">
                                    <h6>Total Liabilities & Equity</h6>
                                    <h6>{renderMoney(reportData.total_liabilities_and_equity)}</h6>
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
