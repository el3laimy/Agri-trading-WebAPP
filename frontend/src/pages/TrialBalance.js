import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getTrialBalance } from '../api/reports';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Import shared components
import { PageHeader, ActionButton, SearchBox, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function TrialBalance() {
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totals, setTotals] = useState({ debit: 0, credit: 0 });

    const [searchTerm, setSearchTerm] = useState('');
    const [accountTypeFilter, setAccountTypeFilter] = useState('');
    const [showZeroBalance, setShowZeroBalance] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('table');
    const printRef = useRef();

    const fetchTrialBalance = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTrialBalance();
            setAccounts(data);
            setFilteredAccounts(data);
            calculateTotals(data);
        } catch (err) {
            setError('فشل في تحميل ميزان المراجعة');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTrialBalance(); }, [fetchTrialBalance]);

    useEffect(() => {
        let result = [...accounts];
        if (searchTerm) result = result.filter(acc => acc.account_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        if (accountTypeFilter) result = result.filter(acc => acc.account_type === accountTypeFilter);
        if (!showZeroBalance) result = result.filter(acc => Math.abs(acc.total_debit - acc.total_credit) > 0.01);
        setFilteredAccounts(result);
        calculateTotals(result);
    }, [searchTerm, accountTypeFilter, showZeroBalance, accounts]);

    const calculateTotals = (data) => {
        let totalDebit = 0, totalCredit = 0;
        data.forEach(acc => {
            const balance = acc.total_debit - acc.total_credit;
            if (balance > 0) totalDebit += balance;
            else totalCredit += Math.abs(balance);
        });
        setTotals({ debit: totalDebit, credit: totalCredit });
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format(amount || 0);
    const accountTypes = [...new Set(accounts.map(acc => acc.account_type).filter(Boolean))];
    const accountTypeLabels = { 'asset': 'أصول', 'liability': 'خصوم', 'equity': 'حقوق ملكية', 'revenue': 'إيرادات', 'expense': 'مصروفات', 'cash': 'نقدية', 'receivable': 'ذمم مدينة', 'payable': 'ذمم دائنة' };

    const debitAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit > 0);
    const creditAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit < 0);

    const debitChartData = { labels: debitAccounts.slice(0, 8).map(acc => acc.account_name), datasets: [{ data: debitAccounts.slice(0, 8).map(acc => acc.total_debit - acc.total_credit), backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#059669', '#047857', '#065F46', '#064E3B'], borderWidth: 0 }] };
    const creditChartData = { labels: creditAccounts.slice(0, 8).map(acc => acc.account_name), datasets: [{ data: creditAccounts.slice(0, 8).map(acc => Math.abs(acc.total_debit - acc.total_credit)), backgroundColor: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'], borderWidth: 0 }] };
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo', size: 11 }, usePointStyle: true } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)}` } } }, cutout: '60%' };

    const handlePrint = () => window.print();
    const exportToCsv = () => {
        const headers = ['الحساب', 'نوع الحساب', 'مدين', 'دائن'];
        const rows = filteredAccounts.map(acc => { const balance = acc.total_debit - acc.total_credit; return [acc.account_name, accountTypeLabels[acc.account_type] || acc.account_type || '-', balance > 0 ? balance.toFixed(2) : '', balance < 0 ? (-balance).toFixed(2) : '']; });
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
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-green-200 to-lime-200 dark:from-green-800/30 dark:to-lime-800/30" />
                </div>
                <div className="neumorphic p-6"><LoadingCard rows={8} /></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title="ميزان المراجعة"
                subtitle="عرض أرصدة جميع الحسابات"
                icon="bi-calculator"
                gradient="from-green-500 to-lime-500"
                actions={
                    <div className="flex gap-2">
                        <div className="flex rounded-xl overflow-hidden border border-white/30">
                            <button className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-white text-green-600' : 'text-white hover:bg-white/10'}`} onClick={() => setViewMode('table')}>
                                <i className="bi bi-table ml-1" />جدول
                            </button>
                            <button className={`px-3 py-2 text-sm ${viewMode === 'chart' ? 'bg-white text-green-600' : 'text-white hover:bg-white/10'}`} onClick={() => setViewMode('chart')}>
                                <i className="bi bi-pie-chart ml-1" />رسم بياني
                            </button>
                        </div>
                        <ActionButton label="تصدير" icon="bi-download" onClick={exportToCsv} variant="primary" />
                        <ActionButton label="طباعة" icon="bi-printer" onClick={handlePrint} variant="primary" />
                    </div>
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-arrow-up-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي المدين</p>
                                <p className="text-lg font-bold">{formatCurrency(totals.debit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-arrow-down-circle text-lg text-red-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي الدائن</p>
                                <p className="text-lg font-bold">{formatCurrency(totals.credit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className={`glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3 ${isBalanced ? 'ring-2 ring-green-400/50' : 'ring-2 ring-amber-400/50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${isBalanced ? 'bg-green-500/30' : 'bg-amber-500/30'} flex items-center justify-center animate-float`}>
                                <i className={`bi ${isBalanced ? 'bi-check-circle' : 'bi-exclamation-triangle'} text-lg ${isBalanced ? 'text-green-300' : 'text-amber-300'}`} />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">حالة التوازن</p>
                                <p className="text-lg font-bold">{isBalanced ? '✓ متوازن' : `فرق: ${formatCurrency(Math.abs(totals.debit - totals.credit))}`}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Error */}
            {error && (
                <div className="neumorphic p-4 mb-6 border-r-4 border-red-500 animate-fade-in">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <i className="bi bi-exclamation-triangle-fill text-xl" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="neumorphic p-4 mb-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"><i className="bi bi-search ml-1" />بحث</label>
                        <input type="text" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" placeholder="بحث في اسم الحساب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"><i className="bi bi-funnel ml-1" />نوع الحساب</label>
                        <select className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" value={accountTypeFilter} onChange={e => setAccountTypeFilter(e.target.value)}>
                            <option value="">جميع الأنواع</option>
                            {accountTypes.map(type => (<option key={type} value={type}>{accountTypeLabels[type] || type}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"><i className="bi bi-calendar ml-1" />بتاريخ</label>
                        <DatePicker selected={asOfDate} onChange={date => setAsOfDate(date)} className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" dateFormat="yyyy-MM-dd" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="showZeroBalance" checked={showZeroBalance} onChange={e => setShowZeroBalance(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                        <label htmlFor="showZeroBalance" className="text-sm text-gray-700 dark:text-gray-300">عرض الأرصدة الصفرية</label>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'table' ? (
                <div className="neumorphic overflow-hidden animate-fade-in">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <i className="bi bi-list-ul text-green-500" />تفاصيل الحسابات
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{filteredAccounts.length}</span>
                        </h5>
                    </div>
                    <div ref={printRef}>
                        {filteredAccounts.length === 0 ? (
                            <div className="text-center py-16 animate-fade-in">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900/30 dark:to-lime-900/30 flex items-center justify-center animate-float">
                                    <i className="bi bi-inbox text-5xl text-green-400" />
                                </div>
                                <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد حسابات</h4>
                                <p className="text-sm text-gray-500">لم يتم العثور على حسابات تطابق معايير البحث</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="px-4 py-4 font-bold text-right">#</th>
                                            <th className="px-4 py-4 font-bold text-right">الحساب</th>
                                            <th className="px-4 py-4 font-bold text-right">النوع</th>
                                            <th className="px-4 py-4 font-bold text-left text-green-600">مدين</th>
                                            <th className="px-4 py-4 font-bold text-left text-red-500">دائن</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {filteredAccounts.map((acc, idx) => {
                                            const balance = acc.total_debit - acc.total_credit;
                                            return (
                                                <tr key={acc.account_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                                                    <td className="px-4 py-4 text-gray-400">{idx + 1}</td>
                                                    <td className="px-4 py-4 font-medium text-gray-800 dark:text-gray-200">{acc.account_name}</td>
                                                    <td className="px-4 py-4"><span className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300">{accountTypeLabels[acc.account_type] || acc.account_type || '-'}</span></td>
                                                    <td className="px-4 py-4 text-left">{balance > 0 && <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(balance)}</span>}</td>
                                                    <td className="px-4 py-4 text-left">{balance < 0 && <span className="font-bold text-red-500 dark:text-red-400">{formatCurrency(-balance)}</span>}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-800 dark:bg-slate-900 text-white">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-4 font-bold">الإجمالي</td>
                                            <td className="px-4 py-4 text-left font-bold">{formatCurrency(totals.debit)}</td>
                                            <td className="px-4 py-4 text-left font-bold">{formatCurrency(totals.credit)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="neumorphic overflow-hidden">
                        <div className="bg-green-600 text-white px-5 py-4"><h5 className="font-bold flex items-center gap-2"><i className="bi bi-arrow-up-circle" />أرصدة مدينة</h5></div>
                        <div className="p-5">{debitAccounts.length > 0 ? (<div style={{ height: '350px' }}><Doughnut data={debitChartData} options={chartOptions} /></div>) : (<div className="text-center py-12 text-gray-400"><i className="bi bi-pie-chart text-6xl block mb-4 opacity-25" /><p>لا توجد أرصدة مدينة</p></div>)}</div>
                    </div>
                    <div className="neumorphic overflow-hidden">
                        <div className="bg-red-500 text-white px-5 py-4"><h5 className="font-bold flex items-center gap-2"><i className="bi bi-arrow-down-circle" />أرصدة دائنة</h5></div>
                        <div className="p-5">{creditAccounts.length > 0 ? (<div style={{ height: '350px' }}><Doughnut data={creditChartData} options={chartOptions} /></div>) : (<div className="text-center py-12 text-gray-400"><i className="bi bi-pie-chart text-6xl block mb-4 opacity-25" /><p>لا توجد أرصدة دائنة</p></div>)}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrialBalance;
