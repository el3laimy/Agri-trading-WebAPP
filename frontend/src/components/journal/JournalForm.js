import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrency } from '../../utils/formatters';

const JournalForm = ({ accounts, onSubmit, onCancel }) => {
    const [entryDate, setEntryDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState([
        { account_id: '', debit: '', credit: '' },
        { account_id: '', debit: '', credit: '' }
    ]);
    const [error, setError] = useState('');

    const handleLineChange = (index, field, value) => {
        const newLines = [...lines];
        newLines[index][field] = value;

        // If debit is entered, clear credit and vice versa
        if (field === 'debit' && value) newLines[index].credit = '';
        if (field === 'credit' && value) newLines[index].debit = '';

        setLines(newLines);
    };

    const addLine = () => {
        setLines([...lines, { account_id: '', debit: '', credit: '' }]);
    };

    const removeLine = (index) => {
        if (lines.length > 2) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const calculateTotals = () => {
        const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
        const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
        return { totalDebit, totalCredit };
    };

    const { totalDebit, totalCredit } = calculateTotals();
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!description.trim()) {
            setError('يجب إدخال وصف للقيد');
            return;
        }

        if (!isBalanced) {
            setError('القيد غير متوازن. يجب أن يتساوى إجمالي المدين والدائن.');
            return;
        }

        const validLines = lines.filter(line => line.account_id && (line.debit > 0 || line.credit > 0));
        if (validLines.length < 2) {
            setError('يجب إدخال سطرين على الأقل بقيم صحيحة.');
            return;
        }

        onSubmit({
            entry_date: entryDate.toISOString().split('T')[0],
            description,
            lines: validLines.map(line => ({
                account_id: parseInt(line.account_id),
                debit: parseFloat(line.debit) || 0,
                credit: parseFloat(line.credit) || 0
            }))
        });
    };

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                    <i className="bi bi-plus-circle me-2"></i>
                    إضافة قيد محاسبي جديد
                </h5>
            </div>
            <div className="card-body">
                {error && (
                    <div className="alert alert-danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>{error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label">تاريخ القيد</label>
                            <DatePicker
                                selected={entryDate}
                                onChange={date => setEntryDate(date)}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                                required
                            />
                        </div>
                        <div className="col-md-8">
                            <label className="form-label">وصف القيد</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="أدخل وصف القيد المحاسبي"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="table-responsive mb-3">
                        <table className="table table-bordered">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '40%' }}>الحساب</th>
                                    <th style={{ width: '25%' }}>مدين</th>
                                    <th style={{ width: '25%' }}>دائن</th>
                                    <th style={{ width: '10%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line, index) => (
                                    <tr key={index}>
                                        <td>
                                            <select
                                                className="form-select"
                                                value={line.account_id}
                                                onChange={e => handleLineChange(index, 'account_id', e.target.value)}
                                                required
                                            >
                                                <option value="">اختر الحساب</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.account_id} value={acc.account_id}>
                                                        {acc.account_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="form-control text-end"
                                                placeholder="0.00"
                                                value={line.debit}
                                                onChange={e => handleLineChange(index, 'debit', e.target.value)}
                                                disabled={!!line.credit}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="form-control text-end"
                                                placeholder="0.00"
                                                value={line.credit}
                                                onChange={e => handleLineChange(index, 'credit', e.target.value)}
                                                disabled={!!line.debit}
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => removeLine(index)}
                                                disabled={lines.length <= 2}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="table-secondary">
                                <tr>
                                    <td className="fw-bold">الإجمالي</td>
                                    <td className={`text-end fw-bold ${isBalanced ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(totalDebit)}
                                    </td>
                                    <td className={`text-end fw-bold ${isBalanced ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(totalCredit)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                        <button type="button" className="btn btn-outline-primary" onClick={addLine}>
                            <i className="bi bi-plus me-1"></i>
                            إضافة سطر
                        </button>
                        <div className="d-flex gap-2">
                            <span className={`badge ${isBalanced ? 'bg-success' : 'bg-warning'} p-2 d-flex align-items-center`}>
                                {isBalanced ? '✓ القيد متوازن' : '⚠ القيد غير متوازن'}
                            </span>
                            <button type="button" className="btn btn-secondary" onClick={onCancel}>
                                إلغاء
                            </button>
                            <button type="submit" className="btn btn-success" disabled={!isBalanced}>
                                <i className="bi bi-check-lg me-1"></i>
                                حفظ القيد
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JournalForm;
