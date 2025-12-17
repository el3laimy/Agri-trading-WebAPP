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
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="p-2">
            <div className="row g-4">
                {/* Left Column: Primary Info */}
                <div className="col-md-7 border-end">
                    <h6 className="text-muted fw-bold mb-3 text-uppercase small ls-1">تفاصيل المصروف الأساسية</h6>

                    <div className="mb-4">
                        <label htmlFor="amount" className="form-label text-muted small">المبلغ</label>
                        <div className="input-group input-group-lg">
                            <input
                                type="number"
                                step="0.01"
                                className="form-control fw-bold text-success"
                                id="amount"
                                name="amount"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                autoFocus
                            />
                            <span className="input-group-text bg-light text-muted fw-bold">ج.م</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="form-label text-muted small">الوصف</label>
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            id="description"
                            name="description"
                            placeholder="مثال: صيانة جرار، وقود، كهرباء..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="expense_date" className="form-label text-muted small">تاريخ المصروف</label>
                        <input
                            type="date"
                            className="form-control"
                            id="expense_date"
                            name="expense_date"
                            value={formData.expense_date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Right Column: Classification */}
                <div className="col-md-5 bg-light p-4 rounded-3">
                    <h6 className="text-muted fw-bold mb-3 text-uppercase small ls-1">التصنيف والحسابات</h6>

                    <div className="mb-3">
                        <label htmlFor="debit_account_id" className="form-label small fw-bold">نوع المصروف (من)</label>
                        <select
                            className="form-select"
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

                    <div className="mb-3">
                        <label htmlFor="credit_account_id" className="form-label small fw-bold">طريقة الدفع (إلى)</label>
                        <select
                            className="form-select"
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

                    <div className="mb-3">
                        <label htmlFor="supplier_id" className="form-label small fw-bold">المورد (اختياري)</label>
                        <select
                            className="form-select"
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

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <button type="button" className="btn btn-outline-secondary me-2 px-4" onClick={onCancel}>إلغاء</button>
                <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm">
                    {expense ? 'حفظ التعديلات' : 'تسجيل المصروف'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
