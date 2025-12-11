import React, { useState, useEffect } from 'react';
import { getTrialBalance } from '../api/reports';

function TrialBalance() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ debit: 0, credit: 0 });

    useEffect(() => {
        fetchTrialBalance();
    }, []);

    const fetchTrialBalance = async () => {
        setLoading(true);
        try {
            const data = await getTrialBalance();
            setAccounts(data);
            // Calculate totals
            const totalDebit = data.reduce((sum, acc) => sum + acc.total_debit, 0);
            const totalCredit = data.reduce((sum, acc) => sum + acc.total_credit, 0);
            setTotals({ debit: totalDebit, credit: totalCredit });
        } catch (error) {
            console.error("Failed to fetch trial balance:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <h2>ميزان المراجعة</h2>
            <div className="card">
                <div className="card-body">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>الحساب</th>
                                <th>مدين</th>
                                <th>دائن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => {
                                const balance = acc.total_debit - acc.total_credit;
                                return (
                                    <tr key={acc.account_id}>
                                        <td>{acc.account_name}</td>
                                        <td>{balance > 0 ? balance.toFixed(2) : ''}</td>
                                        <td>{balance < 0 ? (-balance).toFixed(2) : ''}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="table-dark">
                                <td><strong>الإجمالي</strong></td>
                                <td><strong>{totals.debit.toFixed(2)}</strong></td>
                                <td><strong>{totals.credit.toFixed(2)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default TrialBalance;
