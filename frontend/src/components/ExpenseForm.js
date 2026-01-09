import React, { useState, useEffect } from 'react';

const ExpenseForm = ({ onSave, onCancel, expense }) => {
    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        debit_account_id: '',
        credit_account_id: '',
        supplier_id: '',
    });

    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (expense) {
            setFormData({
                expense_date: expense.expense_date,
                description: expense.description,
                amount: expense.amount,
                debit_account_id: expense.debit_account_id,
                credit_account_id: expense.credit_account_id,
                supplier_id: expense.supplier_id || '',
            });
        }
    }, [expense]);

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
        const payload = {
            ...formData,
            amount: parseFloat(formData.amount),
            debit_account_id: parseInt(formData.debit_account_id),
            credit_account_id: parseInt(formData.credit_account_id),
            supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        };
        onSave(payload);
    };

    const expenseAccounts = accounts.filter(acc => acc.account_type === 'EXPENSE');
    const paymentAccounts = accounts.filter(acc => ['ASSET', 'LIABILITY'].includes(acc.account_type));
    const supplierContacts = contacts.filter(c => c.is_supplier);

    if (loading) return (
        <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400" role="status">
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="p-2 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Primary Info */}
                <div className="border-e border-gray-100 dark:border-slate-700 pe-0 md:pe-6 transition-colors">
                    <h6 className="text-gray-500 dark:text-gray-400 font-bold mb-4 text-xs uppercase tracking-wide">تفاصيل المصروف الأساسية</h6>

                    <div className="mb-6">
                        <label htmlFor="amount" className="block text-gray-500 dark:text-gray-400 text-sm mb-2">المبلغ</label>
                        <div className="relative rounded-lg shadow-sm">
                            <input
                                type="number"
                                step="0.01"
                                className="block w-full pe-12 ps-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors"
                                id="amount"
                                name="amount"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-0 pe-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 dark:text-gray-400 font-bold sm:text-sm">ج.م</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="description" className="block text-gray-500 dark:text-gray-400 text-sm mb-2">الوصف</label>
                        <input
                            type="text"
                            className="block w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 transition-colors"
                            id="description"
                            name="description"
                            placeholder="مثال: صيانة جرار، وقود، كهرباء..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="expense_date" className="block text-gray-500 dark:text-gray-400 text-sm mb-2">تاريخ المصروف</label>
                        <input
                            type="date"
                            className="block w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 transition-colors"
                            id="expense_date"
                            name="expense_date"
                            value={formData.expense_date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Right Column: Classification */}
                <div className="bg-gray-50 dark:bg-slate-900/40 p-6 rounded-xl transition-colors">
                    <h6 className="text-gray-500 dark:text-gray-400 font-bold mb-4 text-xs uppercase tracking-wide">التصنيف والحسابات</h6>

                    <div className="mb-4">
                        <label htmlFor="debit_account_id" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">نوع المصروف (من)</label>
                        <select
                            className="block w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 transition-colors"
                            id="debit_account_id"
                            name="debit_account_id"
                            value={formData.debit_account_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">اختر نوع المصروف...</option>
                            {expenseAccounts.map(acc => (
                                <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="credit_account_id" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">طريقة الدفع (إلى)</label>
                        <select
                            className="block w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 transition-colors"
                            id="credit_account_id"
                            name="credit_account_id"
                            value={formData.credit_account_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">اختر طريقة الدفع (خزينة/بنك)...</option>
                            {paymentAccounts.map(acc => (
                                <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="supplier_id" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المورد (اختياري)</label>
                        <select
                            className="block w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100 transition-colors"
                            id="supplier_id"
                            name="supplier_id"
                            value={formData.supplier_id}
                            onChange={handleChange}
                        >
                            <option value="">-- بدون مورد --</option>
                            {supplierContacts.map(c => (
                                <option key={c.contact_id} value={c.contact_id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-gray-100 dark:border-slate-700 transition-colors">
                <button
                    type="button"
                    className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium me-3 transition-all shadow-sm"
                    onClick={onCancel}
                >
                    إلغاء
                </button>
                <button
                    type="submit"
                    className="px-8 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 font-bold shadow-sm transition-all transform hover:scale-105"
                >
                    {expense ? 'حفظ التعديلات' : 'تسجيل المصروف'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
