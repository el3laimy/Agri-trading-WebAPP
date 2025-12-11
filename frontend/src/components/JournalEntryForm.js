import React, { useState, useEffect } from 'react';

const JournalEntryForm = ({ onSave, onCancel }) => {
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState([{ account_id: '', debit: '', credit: '' }, { account_id: '', debit: '', credit: '' }]);
    const [accounts, setAccounts] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/financial-accounts/');
                const data = await response.json();
                setAccounts(data);
            } catch (err) {
                console.error("Failed to fetch accounts", err);
            }
        };
        fetchAccounts();
    }, []);

    const handleLineChange = (index, field, value) => {
        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
    };

    const addLine = () => {
        setLines([...lines, { account_id: '', debit: '', credit: '' }]);
    };

    const removeLine = (index) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
        const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

        if (totalDebit.toFixed(2) !== totalCredit.toFixed(2)) {
            setError('Total debits must equal total credits.');
            return;
        }
        if (totalDebit === 0) {
            setError('Entries cannot be zero.');
            return;
        }
        setError('');
        
        const payload = {
            entry_date: entryDate,
            description: description,
            lines: lines.map(l => ({
                ...l,
                account_id: parseInt(l.account_id),
                debit: parseFloat(l.debit) || 0,
                credit: parseFloat(l.credit) || 0,
            })).filter(l => l.debit > 0 || l.credit > 0)
        };
        onSave(payload);
    };

    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-light border rounded">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row mb-3">
                <div className="col-md-4">
                    <label>Entry Date</label>
                    <input type="date" className="form-control" value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
                </div>
                <div className="col-md-8">
                    <label>Description</label>
                    <input type="text" className="form-control" placeholder="Journal entry description" value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
            </div>

            {lines.map((line, index) => (
                <div key={index} className="row g-2 mb-2 align-items-center">
                    <div className="col-md-5">
                        <select className="form-select" value={line.account_id} onChange={e => handleLineChange(index, 'account_id', e.target.value)} required>
                            <option value="">Select Account</option>
                            {accounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <input type="number" step="0.01" className="form-control" placeholder="Debit" value={line.debit} onChange={e => handleLineChange(index, 'debit', e.target.value)} />
                    </div>
                    <div className="col-md-3">
                        <input type="number" step="0.01" className="form-control" placeholder="Credit" value={line.credit} onChange={e => handleLineChange(index, 'credit', e.target.value)} />
                    </div>
                    <div className="col-md-1">
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLine(index)}>X</button>
                    </div>
                </div>
            ))}

            <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={addLine}>+ Add Line</button>

            <div className="row fw-bold text-end">
                <div className="col-md-5">Total</div>
                <div className="col-md-3"><input type="text" className="form-control text-end" value={totalDebit.toFixed(2)} readOnly /></div>
                <div className="col-md-3"><input type="text" className="form-control text-end" value={totalCredit.toFixed(2)} readOnly /></div>
            </div>

            <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-secondary me-2" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Journal Entry</button>
            </div>
        </form>
    );
};

export default JournalEntryForm;
