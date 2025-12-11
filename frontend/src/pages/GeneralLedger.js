import React, { useState, useEffect } from 'react';
import { getGeneralLedger } from '../api/reports';

function GeneralLedger() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const data = await getGeneralLedger();
            setEntries(data);
        } catch (error) {
            console.error("Failed to fetch general ledger:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <h2>دفتر الأستاذ العام</h2>
            <div className="card">
                <div className="card-body">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>الحساب</th>
                                <th>الوصف</th>
                                <th>مدين</th>
                                <th>دائن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.entry_id}>
                                    <td>{entry.entry_date}</td>
                                    <td>{entry.account.account_name}</td>
                                    <td>{entry.description}</td>
                                    <td>{entry.debit > 0 ? entry.debit.toFixed(2) : ''}</td>
                                    <td>{entry.credit > 0 ? entry.credit.toFixed(2) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default GeneralLedger;
