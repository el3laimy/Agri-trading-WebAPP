import React, { useState, useEffect } from 'react';

const ExpenseForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        debit_account_id: '',
        credit_account_id: '',
        supplier_id: null,
    });

    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accountsRes, contactsRes] = await Promise.all([
                    fetch('http://localhost:8000/api/v1/financial-accounts/'),
                    fetch('http://localhost:8000/api/v1/contacts/'),
                ]);
                const accountsData = await accountsRes.json();
                const contactsData = await contactsRes.json();
                setAccounts(accountsData);
                setContacts(contactsData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const expenseAccounts = accounts.filter(acc => acc.account_type === 'EXPENSE');
    const paymentAccounts = accounts.filter(acc => ['ASSET', 'LIABILITY'].includes(acc.account_type));
    const supplierContacts = contacts.filter(c => c.is_supplier);

    if (loading) return <p>Loading form data...</p>;

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label htmlFor="expense_date" className="form-label">Expense Date</label>
                    <input type="date" className="form-control" id="expense_date" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                    <label htmlFor="amount" className="form-label">Amount</label>
                    <input type="number" step="0.01" className="form-control" id="amount" name="amount" value={formData.amount} onChange={handleChange} required />
                </div>
            </div>
            <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <input type="text" className="form-control" id="description" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label htmlFor="debit_account_id" className="form-label">Expense Account (Debit)</label>
                    <select className="form-select" id="debit_account_id" name="debit_account_id" value={formData.debit_account_id} onChange={handleChange} required>
                        <option value="">Select Expense Account</option>
                        {expenseAccounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                    </select>
                </div>
                <div className="col-md-6 mb-3">
                    <label htmlFor="credit_account_id" className="form-label">Payment Account (Credit)</label>
                    <select className="form-select" id="credit_account_id" name="credit_account_id" value={formData.credit_account_id} onChange={handleChange} required>
                        <option value="">Select Payment Account</option>
                        {paymentAccounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                    </select>
                </div>
            </div>
            <div className="mb-3">
                <label htmlFor="supplier_id" className="form-label">Supplier (Optional)</label>
                <select className="form-select" id="supplier_id" name="supplier_id" value={formData.supplier_id || ''} onChange={handleChange}>
                    <option value="">None</option>
                    {supplierContacts.map(c => <option key={c.contact_id} value={c.contact_id}>{c.name}</option>)}
                </select>
            </div>
            <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary me-2" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
            </div>
        </form>
    );
};

export default ExpenseForm;
