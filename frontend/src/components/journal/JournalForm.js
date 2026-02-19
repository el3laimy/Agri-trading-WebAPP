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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 overflow-hidden">
            <div className="bg-emerald-600 text-white px-5 py-4">
                <h5 className="font-bold flex items-center gap-2 mb-0">
                    <i className="bi bi-plus-circle"></i>
                    إضافة قيد محاسبي جديد
                </h5>
            </div>
            <div className="p-5">
                {error && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-4 flex items-center gap-2">
                        <i className="bi bi-exclamation-triangle"></i>{error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ القيد</label>
                            <DatePicker
                                selected={entryDate}
                                onChange={date => setEntryDate(date)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                dateFormat="yyyy-MM-dd"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وصف القيد</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="أدخل وصف القيد المحاسبي"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto mb-4">
                        <table className="min-w-full border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <thead className="bg-gray-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '40%' }}>الحساب</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '25%' }}>مدين</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '25%' }}>دائن</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '10%' }}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {lines.map((line, index) => (
                                    <tr key={index} className="bg-white dark:bg-slate-800">
                                        <td className="px-4 py-2">
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
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
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-left focus:ring-2 focus:ring-emerald-500"
                                                placeholder="0.00"
                                                value={line.debit}
                                                onChange={e => handleLineChange(index, 'debit', e.target.value)}
                                                disabled={!!line.credit}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-left focus:ring-2 focus:ring-emerald-500"
                                                placeholder="0.00"
                                                value={line.credit}
                                                onChange={e => handleLineChange(index, 'credit', e.target.value)}
                                                disabled={!!line.debit}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                type="button"
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                onClick={() => removeLine(index)}
                                                disabled={lines.length <= 2}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-slate-700">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">الإجمالي</td>
                                    <td className={`px-4 py-3 text-left font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {formatCurrency(totalDebit)}
                                    </td>
                                    <td className={`px-4 py-3 text-left font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {formatCurrency(totalCredit)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-between items-center">
                        <button type="button" className="px-4 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-1" onClick={addLine}>
                            <i className="bi bi-plus"></i>
                            إضافة سطر
                        </button>
                        <div className="flex gap-2 items-center">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${isBalanced ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                {isBalanced ? '✓ القيد متوازن' : '⚠ القيد غير متوازن'}
                            </span>
                            <button type="button" className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors" onClick={onCancel}>
                                إلغاء
                            </button>
                            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1" disabled={!isBalanced}>
                                <i className="bi bi-check-lg"></i>
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
