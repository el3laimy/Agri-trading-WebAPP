import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getTrialBalance } from '../api/reports';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function TrialBalance() {
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totals, setTotals] = useState({ debit: 0, credit: 0 });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [accountTypeFilter, setAccountTypeFilter] = useState('');
    const [showZeroBalance, setShowZeroBalance] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date());

    // View options
    const [viewMode, setViewMode] = useState('table');

    const printRef = useRef();

    const fetchTrialBalance = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTrialBalance();
            setAccounts(data);
            setFilteredAccounts(data);
            calculateTotals(data);
        } catch (err) {
            setError('فشل في تحميل ميزان المراجعة. يرجى المحاولة مرة أخرى.');
            console.error("Failed to fetch trial balance:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrialBalance();
    }, [fetchTrialBalance]);

    useEffect(() => {
        let result = [...accounts];
        if (searchTerm) {
            result = result.filter(acc =>
                acc.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (accountTypeFilter) {
            result = result.filter(acc => acc.account_type === accountTypeFilter);
        }
        if (!showZeroBalance) {
            result = result.filter(acc => {
                const balance = acc.total_debit - acc.total_credit;
                return Math.abs(balance) > 0.01;
            });
        }
        setFilteredAccounts(result);
        calculateTotals(result);
    }, [searchTerm, accountTypeFilter, showZeroBalance, accounts]);

    const calculateTotals = (data) => {
        let totalDebit = 0;
        let totalCredit = 0;
        data.forEach(acc => {
            const balance = acc.total_debit - acc.total_credit;
            if (balance > 0) totalDebit += balance;
            else totalCredit += Math.abs(balance);
        });
        setTotals({ debit: totalDebit, credit: totalCredit });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const accountTypes = [...new Set(accounts.map(acc => acc.account_type).filter(Boolean))];

    const accountTypeLabels = {
        'asset': 'أصول', 'liability': 'خصوم', 'equity': 'حقوق ملكية',
        'revenue': 'إيرادات', 'expense': 'مصروفات', 'cash': 'نقدية',
        'receivable': 'ذمم مدينة', 'payable': 'ذمم دائنة'
    };

    const debitAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit > 0);
    const creditAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit < 0);

    const debitChartData = {
        labels: debitAccounts.slice(0, 8).map(acc => acc.account_name),
        datasets: [{
            data: debitAccounts.slice(0, 8).map(acc => acc.total_debit - acc.total_credit),
            backgroundColor: ['#1E5631', '#28A745', '#3D8B4F', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'],
            borderWidth: 0
        }]
    };

    const creditChartData = {
        labels: creditAccounts.slice(0, 8).map(acc => acc.account_name),
        datasets: [{
            data: creditAccounts.slice(0, 8).map(acc => Math.abs(acc.total_debit - acc.total_credit)),
            backgroundColor: ['#DC3545', '#E53935', '#F44336', '#EF5350', '#E57373', '#EF9A9A', '#FFCDD2', '#FFEBEE'],
            borderWidth: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { font: { family: 'Cairo', size: 11 }, usePointStyle: true, padding: 10 } },
            tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)}` } }
        },
        cutout: '60%'
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl"><head><title>ميزان المراجعة - ${asOfDate.toLocaleDateString('en-US')}</title>
            <style>body { font-family: 'Cairo', sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: right; } th { background-color: #1E5631; color: white; } .text-success { color: #28A745; } .text-danger { color: #DC3545; } tfoot { font-weight: bold; background-color: #f5f5f5; } h1 { color: #1E5631; text-align: center; } .header-info { text-align: center; color: #666; margin-bottom: 20px; } @media print { body { -webkit-print-color-adjust: exact; } }</style></head>
            <body><h1>ميزان المراجعة</h1><p class="header-info">بتاريخ: ${asOfDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>${printContent.innerHTML}</body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const exportToCsv = () => {
        const headers = ['الحساب', 'نوع الحساب', 'مدين', 'دائن'];
        const rows = filteredAccounts.map(acc => {
            const balance = acc.total_debit - acc.total_credit;
            return [acc.account_name, accountTypeLabels[acc.account_type] || acc.account_type || '-', balance > 0 ? balance.toFixed(2) : '', balance < 0 ? (-balance).toFixed(2) : ''];
        });
        rows.push(['الإجمالي', '', totals.debit.toFixed(2), totals.credit.toFixed(2)]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trial_balance_${asOfDate.toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400">جاري تحميل ميزان المراجعة...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="bi bi-calculator text-emerald-600"></i>
                        ميزان المراجعة
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">عرض أرصدة جميع الحسابات</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600">
                        <button
                            className={`px-4 py-2 flex items-center gap-1 transition-colors ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <i className="bi bi-table"></i>جدول
                        </button>
                        <button
                            className={`px-4 py-2 flex items-center gap-1 transition-colors ${viewMode === 'chart' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                            onClick={() => setViewMode('chart')}
                        >
                            <i className="bi bi-pie-chart"></i>رسم بياني
                        </button>
                    </div>
                    <button className="px-4 py-2 border border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-1" onClick={exportToCsv}>
                        <i className="bi bi-download"></i>تصدير
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1" onClick={handlePrint}>
                        <i className="bi bi-printer"></i>طباعة
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 mb-4 flex items-center gap-2">
                    <i className="bi bi-exclamation-triangle"></i>{error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-green-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <h6 className="text-gray-500 dark:text-gray-400 text-sm mb-1">إجمالي المدين</h6>
                            <h4 className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.debit)}</h4>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                            <i className="bi bi-arrow-up-circle text-green-600 dark:text-green-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-red-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <h6 className="text-gray-500 dark:text-gray-400 text-sm mb-1">إجمالي الدائن</h6>
                            <h4 className="text-xl font-bold text-red-500 dark:text-red-400">{formatCurrency(totals.credit)}</h4>
                        </div>
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                            <i className="bi bi-arrow-down-circle text-red-500 dark:text-red-400 text-xl"></i>
                        </div>
                    </div>
                </div>
                <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 ${isBalanced ? 'border-green-500' : 'border-amber-500'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h6 className="text-gray-500 dark:text-gray-400 text-sm mb-1">حالة التوازن</h6>
                            <h4 className={`text-xl font-bold ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {isBalanced ? '✓ متوازن' : `فرق: ${formatCurrency(Math.abs(totals.debit - totals.credit))}`}
                            </h4>
                        </div>
                        <div className={`${isBalanced ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'} p-3 rounded-full`}>
                            <i className={`bi ${isBalanced ? 'bi-check-circle text-green-600 dark:text-green-400' : 'bi-exclamation-triangle text-amber-600 dark:text-amber-400'} text-xl`}></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i className="bi bi-search ml-1"></i>بحث
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                            placeholder="بحث في اسم الحساب..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i className="bi bi-funnel ml-1"></i>نوع الحساب
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                            value={accountTypeFilter}
                            onChange={e => setAccountTypeFilter(e.target.value)}
                        >
                            <option value="">جميع الأنواع</option>
                            {accountTypes.map(type => (
                                <option key={type} value={type}>{accountTypeLabels[type] || type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i className="bi bi-calendar ml-1"></i>بتاريخ
                        </label>
                        <DatePicker
                            selected={asOfDate}
                            onChange={date => setAsOfDate(date)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="showZeroBalance"
                            checked={showZeroBalance}
                            onChange={e => setShowZeroBalance(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="showZeroBalance" className="text-sm text-gray-700 dark:text-gray-300">عرض الأرصدة الصفرية</label>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'table' ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <i className="bi bi-list-ul"></i>
                            تفاصيل الحسابات
                            <span className="bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 text-sm px-2 py-0.5 rounded-full">{filteredAccounts.length}</span>
                        </h5>
                    </div>
                    <div ref={printRef}>
                        {filteredAccounts.length === 0 ? (
                            <div className="text-center py-12">
                                <i className="bi bi-inbox text-gray-400 text-6xl block mb-4"></i>
                                <h5 className="text-gray-500 dark:text-gray-400 font-medium">لا توجد حسابات</h5>
                                <p className="text-gray-400 dark:text-gray-500">لم يتم العثور على حسابات تطابق معايير البحث</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '5%' }}>#</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '45%' }}>الحساب</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '15%' }}>النوع</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '17.5%' }}>مدين</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '17.5%' }}>دائن</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {filteredAccounts.map((acc, index) => {
                                            const balance = acc.total_debit - acc.total_credit;
                                            return (
                                                <tr key={acc.account_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{acc.account_name}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300">
                                                            {accountTypeLabels[acc.account_type] || acc.account_type || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        {balance > 0 && <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(balance)}</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        {balance < 0 && <span className="font-medium text-red-500 dark:text-red-400">{formatCurrency(-balance)}</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-800 dark:bg-slate-900 text-white">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 font-bold">الإجمالي</td>
                                            <td className="px-4 py-3 text-left font-bold">{formatCurrency(totals.debit)}</td>
                                            <td className="px-4 py-3 text-left font-bold">{formatCurrency(totals.credit)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="bg-green-600 text-white px-5 py-4">
                            <h5 className="font-bold flex items-center gap-2"><i className="bi bi-arrow-up-circle"></i>أرصدة مدينة</h5>
                        </div>
                        <div className="p-5">
                            {debitAccounts.length > 0 ? (
                                <div style={{ height: '350px' }}><Doughnut data={debitChartData} options={chartOptions} /></div>
                            ) : (
                                <div className="text-center py-12 text-gray-400"><i className="bi bi-pie-chart text-6xl block mb-4 opacity-25"></i><p>لا توجد أرصدة مدينة</p></div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="bg-red-500 text-white px-5 py-4">
                            <h5 className="font-bold flex items-center gap-2"><i className="bi bi-arrow-down-circle"></i>أرصدة دائنة</h5>
                        </div>
                        <div className="p-5">
                            {creditAccounts.length > 0 ? (
                                <div style={{ height: '350px' }}><Doughnut data={creditChartData} options={chartOptions} /></div>
                            ) : (
                                <div className="text-center py-12 text-gray-400"><i className="bi bi-pie-chart text-6xl block mb-4 opacity-25"></i><p>لا توجد أرصدة دائنة</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrialBalance;
