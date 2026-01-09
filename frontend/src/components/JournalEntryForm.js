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

    const getFieldClass = () => `block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-colors`;
    const getSelectClass = () => `block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-colors`;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-400 p-4 rounded-md shadow-sm" role="alert">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ القيد</label>
                    <input type="date" className={getFieldClass()} value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
                </div>
                <div className="md:col-span-8 space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوصف / البيان</label>
                    <input type="text" className={getFieldClass()} placeholder="وصف العملية المحاسبية..." value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
            </div>

            <div className="space-y-4">
                <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="col-span-5">الحساب</div>
                    <div className="col-span-3 text-center">مدين</div>
                    <div className="col-span-3 text-center">دائن</div>
                    <div className="col-span-1"></div>
                </div>

                {lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50 dark:bg-slate-900/50 p-4 md:p-0 md:bg-transparent rounded-lg md:rounded-none border border-gray-100 md:border-0 dark:border-slate-700">
                        <div className="md:col-span-5">
                            <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">الحساب</label>
                            <select className={getSelectClass()} value={line.account_id} onChange={e => handleLineChange(index, 'account_id', e.target.value)} required>
                                <option value="">اختر الحساب</option>
                                {accounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">مدين</label>
                            <input type="number" step="0.01" className={`${getFieldClass()} text-center`} placeholder="0.00" value={line.debit} onChange={e => handleLineChange(index, 'debit', e.target.value)} />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block md:hidden text-xs font-medium text-gray-500 mb-1">دائن</label>
                            <input type="number" step="0.01" className={`${getFieldClass()} text-center`} placeholder="0.00" value={line.credit} onChange={e => handleLineChange(index, 'credit', e.target.value)} />
                        </div>
                        <div className="md:col-span-1 flex justify-center">
                            <button
                                type="button"
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                onClick={() => removeLine(index)}
                                title="حذف السطر"
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                onClick={addLine}
            >
                <i className="bi bi-plus-lg me-2"></i>
                إضافة سطر جديد
            </button>

            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5 text-left md:text-right font-bold text-gray-700 dark:text-gray-300">الإجماليات:</div>
                    <div className="md:col-span-3">
                        <input type="text" className="block w-full px-3 py-2 border-0 bg-gray-100 dark:bg-slate-900/80 rounded-md text-center font-bold text-indigo-600 dark:text-indigo-400" value={totalDebit.toFixed(2)} readOnly />
                    </div>
                    <div className="md:col-span-3">
                        <input type="text" className="block w-full px-3 py-2 border-0 bg-gray-100 dark:bg-slate-900/80 rounded-md text-center font-bold text-indigo-600 dark:text-indigo-400" value={totalCredit.toFixed(2)} readOnly />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
                <button
                    type="button"
                    className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    onClick={onCancel}
                >
                    إلغاء
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                >
                    حفظ القيد المحاسبي
                </button>
            </div>
        </form>
    );
};

export default JournalEntryForm;
