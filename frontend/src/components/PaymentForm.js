import React, { useState, useEffect } from 'react';

const PaymentForm = ({ purchase, onSave, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [debitAccountId, setDebitAccountId] = useState(''); // Cash/Bank
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const { getFinancialAccounts } = await import('../api/financialAccounts');
                const data = await getFinancialAccounts();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4 md:p-6 animate-fade-in" tabIndex="-1">
            <div className="relative w-full max-w-lg transition-all transform animate-slide-down">
                <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h5 className="text-xl font-bold text-gray-800">
                                <i className="bi bi-wallet2 text-emerald-600 ml-2"></i>
                                تسجيل دفعة للمشتريات #{purchase.purchase_id}
                            </h5>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
                                onClick={onCancel}
                            >
                                <i className="bi bi-x-lg text-lg"></i>
                            </button>
                        </div>
                        <div className="px-6 py-6 space-y-4">
                            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-emerald-700 font-medium">المورد:</span>
                                    <span className="text-sm text-gray-900 font-bold">{purchase.supplier.name}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-emerald-700 font-medium">الإجمالي:</span>
                                    <span className="text-sm text-gray-900 font-bold">{purchase.total_cost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-emerald-700 font-medium">المدفوع:</span>
                                    <span className="text-sm text-gray-900 font-bold">{purchase.amount_paid.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-emerald-200 mt-2 pt-2 flex justify-between items-center">
                                    <span className="text-sm text-emerald-800 font-bold">المستحق:</span>
                                    <span className="text-base text-red-600 font-bold">{remainingAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">تاريخ الدفع</label>
                                    <input
                                        type="date"
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        id="paymentDate"
                                        value={paymentDate}
                                        onChange={e => setPaymentDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">ج.م</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            max={remainingAmount}
                                            className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                            id="amount"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="debitAccountId" className="block text-sm font-medium text-gray-700 mb-1">الدفع من (خزينة/بنك)</label>
                                    <select
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                        id="debitAccountId"
                                        value={debitAccountId}
                                        onChange={e => setDebitAccountId(e.target.value)}
                                        required
                                    >
                                        {paymentAccounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl">
                            <button
                                type="button"
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                                onClick={onCancel}
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-emerald-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-sm transition-colors flex items-center"
                            >
                                <i className="bi bi-check-lg ml-2"></i>
                                حفظ الدفع
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentForm;
