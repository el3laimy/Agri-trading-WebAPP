import React, { useState, useEffect } from 'react';

const PaymentForm = ({ purchase, onSave, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [debitAccountId, setDebitAccountId] = useState(''); // Cash/Bank
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/financial-accounts/');
                const data = await response.json();
                setAccounts(data);
                // Pre-select first asset account if available
                const firstAsset = data.find(acc => acc.account_type === 'ASSET');
                if (firstAsset) {
                    setDebitAccountId(firstAsset.account_id);
                }
            } catch (err) {
                console.error("Failed to fetch accounts", err);
            }
        };
        fetchAccounts();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            payment_date: paymentDate,
            amount: parseFloat(amount),
            contact_id: purchase.supplier.contact_id,
            payment_method: 'BANK', // Hardcoded for now
            credit_account_id: 2, // Hardcoded Accounts Payable for now
            debit_account_id: parseInt(debitAccountId),
            transaction_type: 'PURCHASE',
            transaction_id: purchase.purchase_id,
        };
        onSave(payload);
    };

    const paymentAccounts = accounts.filter(acc => acc.account_type === 'ASSET');
    const remainingAmount = purchase.total_cost - purchase.amount_paid;

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">Record Payment for Purchase #{purchase.purchase_id}</h5>
                            <button type="button" className="btn-close" onClick={onCancel}></button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Supplier:</strong> {purchase.supplier.name}</p>
                            <p><strong>Total Cost:</strong> {purchase.total_cost.toFixed(2)}</p>
                            <p><strong>Amount Paid:</strong> {purchase.amount_paid.toFixed(2)}</p>
                            <p className="fw-bold"><strong>Amount Due:</strong> {remainingAmount.toFixed(2)}</p>
                            <hr />
                            <div className="mb-3">
                                <label htmlFor="paymentDate" className="form-label">Payment Date</label>
                                <input type="date" className="form-control" id="paymentDate" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="amount" className="form-label">Amount</label>
                                <input type="number" step="0.01" max={remainingAmount} className="form-control" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="debitAccountId" className="form-label">Payment From (Cash/Bank)</label>
                                <select className="form-select" id="debitAccountId" value={debitAccountId} onChange={e => setDebitAccountId(e.target.value)} required>
                                    {paymentAccounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onCancel}>Close</button>
                            <button type="submit" className="btn btn-primary">Save Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentForm;
