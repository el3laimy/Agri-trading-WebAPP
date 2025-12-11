import React, { useState, useEffect } from 'react';

const FinancialAccountForm = ({ account, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        account_name: '',
        account_type: 'ASSET', // Default value
        current_balance: 0,
    });

    useEffect(() => {
        if (account) {
            setFormData(account);
        }
    }, [account]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="account_name" className="form-label">Account Name</label>
                <input
                    type="text"
                    className="form-control"
                    id="account_name"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label htmlFor="account_type" className="form-label">Account Type</label>
                <select
                    className="form-select"
                    id="account_type"
                    name="account_type"
                    value={formData.account_type}
                    onChange={handleChange}
                >
                    {accountTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="current_balance" className="form-label">Opening Balance</label>
                <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    id="current_balance"
                    name="current_balance"
                    value={formData.current_balance}
                    onChange={handleChange}
                    disabled={!!account} // Disable for existing accounts
                />
            </div>
            <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary me-2" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
            </div>
        </form>
    );
};

export default FinancialAccountForm;
