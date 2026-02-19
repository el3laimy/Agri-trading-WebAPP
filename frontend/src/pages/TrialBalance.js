import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getTrialBalance } from '../api/reports';
import { getSeasons } from '../api/seasons';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Chart from 'react-apexcharts';

// Import shared components
import { PageHeader, ActionButton, SearchBox, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

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
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    const printRef = useRef();

    const fetchTrialBalance = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = asOfDate.toISOString().split('T')[0];
            const data = await getTrialBalance(dateStr);
            setAccounts(data);
            setFilteredAccounts(data);
            calculateTotals(data);
        } catch (err) {
            setError('ÙØ´Ù„ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ù…ÙŠØ²Ø§Ù† Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©');
        } finally {
            setLoading(false);
        }
    }, [asOfDate]);

    const fetchSeasons = async () => {
        try {
            const data = await getSeasons();
            setSeasons(data);
        } catch (err) { console.error("Failed to fetch seasons", err); }
    };

    useEffect(() => { fetchTrialBalance(); fetchSeasons(); }, [fetchTrialBalance]);

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
    const accountTypeLabels = { 'asset': 'Ø£ØµÙˆÙ„', 'liability': 'Ø®ØµÙˆÙ…', 'equity': 'Ø­Ù‚ÙˆÙ‚ Ù…Ù„ÙƒÙŠØ©', 'revenue': 'Ø¥ÙŠØ±Ø§Ø¯Ø§Øª', 'expense': 'Ù…ØµØ±ÙˆÙØ§Øª', 'cash': 'Ù†Ù‚Ø¯ÙŠØ©', 'receivable': 'Ø°Ù…Ù… Ù…Ø¯ÙŠÙ†Ø©', 'payable': 'Ø°Ù…Ù… Ø¯Ø§Ø¦Ù†Ø©' };

    const debitAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit > 0);
    const creditAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit < 0);

    const debitChartColors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#059669', '#047857', '#065F46', '#064E3B'];
    const creditChartColors = ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'];

    const debitChartOptions = {
        chart: { type: 'donut', fontFamily: 'Cairo, sans-serif' },
        labels: debitAccounts.slice(0, 8).map(acc => acc.account_name),
        colors: debitChartColors.slice(0, debitAccounts.length),
        legend: { position: 'bottom', fontSize: '11px', labels: { useSeriesColors: true } },
        tooltip: { y: { formatter: (val) => formatCurrency(val) } },
        plotOptions: { pie: { donut: { size: '60%' } } },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
    };
    const debitChartSeries = debitAccounts.slice(0, 8).map(acc => acc.total_debit - acc.total_credit);

    const creditChartOptions = {
        chart: { type: 'donut', fontFamily: 'Cairo, sans-serif' },
        labels: creditAccounts.slice(0, 8).map(acc => acc.account_name),
        colors: creditChartColors.slice(0, creditAccounts.length),
        legend: { position: 'bottom', fontSize: '11px', labels: { useSeriesColors: true } },
        tooltip: { y: { formatter: (val) => formatCurrency(val) } },
        plotOptions: { pie: { donut: { size: '60%' } } },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
    };
    const creditChartSeries = creditAccounts.slice(0, 8).map(acc => Math.abs(acc.total_debit - acc.total_credit));

    const handlePrint = () => window.print();
    const exportToCsv = () => {
        const headers = ['Ø§Ù„Ø­Ø³Ø§Ø¨', 'Ù†ÙˆØ¹ Ø§Ù„Ø­Ø³Ø§Ø¨', 'Ù…Ø¯ÙŠÙ†', 'Ø¯Ø§Ø¦Ù†'];
        const rows = filteredAccounts.map(acc => { const balance = acc.total_debit - acc.total_credit; return [acc.account_name, accountTypeLabels[acc.account_type] || acc.account_type || '-', balance > 0 ? balance.toFixed(2) : '', balance < 0 ? (-balance).toFixed(2) : '']; });
        rows.push(['Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ', '', totals.debit.toFixed(2), totals.credit.toFixed(2)]);
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trial_balance_${asOfDate.toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleSeasonChange = (e) => {
        const seasonId = e.target.value;
        setSelectedSeason(seasonId);
        if (seasonId) {
            const season = seasons.find(s => s.season_id === parseInt(seasonId));
            if (season) {
                // Trial Balance usually takes an "As Of" date, so we set it to the season end date
                // or today if the season is active/ongoing
                setAsOfDate(new Date(season.end_date));
            }
        }
    };

    const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-green-200 to-lime-200 dark:from-green-800/30 dark:to-lime-800/30" />
                </div>
                <div className="lg-card p-6"><LoadingCard rows={8} /></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title="Ù…ÙŠØ²Ø§Ù† Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©"
                subtitle="Ø¹Ø±Ø¶ Ø£Ø±ØµØ¯Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª"
                icon="bi-calculator"
                gradient="from-green-500 to-lime-500"
                actions={
                    <div className="flex gap-2">
                        <div className="flex rounded-xl overflow-hidden border border-white/30">
                            <button className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-white text-green-600' : 'text-white hover:bg-white/10'}`} onClick={() => setViewMode('table')}>
                                <i className="bi bi-table ml-1" />Ø¬Ø¯ÙˆÙ„
                            </button>
                            <button className={`px-3 py-2 text-sm ${viewMode === 'chart' ? 'bg-white text-green-600' : 'text-white hover:bg-white/10'}`} onClick={() => setViewMode('chart')}>
                                <i className="bi bi-pie-chart ml-1" />Ø±Ø³Ù… Ø¨ÙŠØ§Ù†ÙŠ
                            </button>
                        </div>
                        <ActionButton label="ØªØµØ¯ÙŠØ±" icon="bi-download" onClick={exportToCsv} variant="primary" />
                        <ActionButton label="Ø·Ø¨Ø§Ø¹Ø©" icon="bi-printer" onClick={handlePrint} variant="primary" />
                    </div>
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-arrow-up-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø¯ÙŠÙ†</p>
                                <p className="text-lg font-bold">{formatCurrency(totals.debit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-arrow-down-circle text-lg text-red-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¯Ø§Ø¦Ù†</p>
                                <p className="text-lg font-bold">{formatCurrency(totals.credit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className={`lg-card px-4 py-3 rounded-xl lg-animate-in ${isBalanced ? 'ring-2 ring-green-400/50' : 'ring-2 ring-amber-400/50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${isBalanced ? 'bg-green-500/30' : 'bg-amber-500/30'} flex items-center justify-center lg-animate-float`}>
                                <i className={`bi ${isBalanced ? 'bi-check-circle' : 'bi-exclamation-triangle'} text-lg ${isBalanced ? 'text-green-300' : 'text-amber-300'}`} />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">Ø­Ø§Ù„Ø© Ø§Ù„ØªÙˆØ§Ø²Ù†</p>
                                <p className="text-lg font-bold">{isBalanced ? 'âœ“ Ù…ØªÙˆØ§Ø²Ù†' : `ÙØ±Ù‚: ${formatCurrency(Math.abs(totals.debit - totals.credit))}`}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Error */}
            {error && (
                <div className="lg-card p-4 mb-6 border-r-4 border-red-500lg-animate-fade">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <i className="bi bi-exclamation-triangle-fill text-xl" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="lg-card p-4 mb-6 lg-animate-fade">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"><i className="bi bi-search ml-1" />Ø¨Ø­Ø«</label>
                        <input type="text" className="w-full p-2.5 lg-input rounded-xl" placeholder="Ø¨Ø­Ø« ÙÙŠ Ø§Ø³Ù… Ø§Ù„Ø­Ø³Ø§Ø¨..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"><i className="bi bi-funnel ml-1" />Ù†ÙˆØ¹ Ø§Ù„Ø­Ø³Ø§Ø¨</label>
                        <select className="w-full p-2.5 lg-input rounded-xl" value={accountTypeFilter} onChange={e => setAccountTypeFilter(e.target.value)}>
                            <option value="">Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹</option>
                            {accountTypes.map(type => (<option key={type} value={type}>{accountTypeLabels[type] || type}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"><i className="bi bi-calendar ml-1" />Ø¨ØªØ§Ø±ÙŠØ®</label>
                        <DatePicker selected={asOfDate} onChange={date => setAsOfDate(date)} className="w-full p-2.5 lg-input rounded-xl" dateFormat="yyyy-MM-dd" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"><i className="bi bi-calendar-range ml-1" />Ø§Ù„Ù…ÙˆØ³Ù…</label>
                        <select className="w-full p-2.5 lg-input rounded-xl" value={selectedSeason} onChange={handleSeasonChange}>
                            <option value="">ØªØ®ØµÙŠØµ ØªØ§Ø±ÙŠØ®</option>
                            {seasons.map(s => <option key={s.season_id} value={s.season_id}>{s.name} ({s.status})</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="showZeroBalance" checked={showZeroBalance} onChange={e => setShowZeroBalance(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                        <label htmlFor="showZeroBalance" className="text-sm text-gray-700 dark:text-gray-300">Ø¹Ø±Ø¶ Ø§Ù„Ø£Ø±ØµØ¯Ø© Ø§Ù„ØµÙØ±ÙŠØ©</label>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'table' ? (
                <div className="lg-card overflow-hidden lg-animate-fade">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <i className="bi bi-list-ul text-green-500" />ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{filteredAccounts.length}</span>
                        </h5>
                    </div>
                    <div ref={printRef}>
                        {filteredAccounts.length === 0 ? (
                            <div className="text-center py-16lg-animate-fade">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900/30 dark:to-lime-900/30 flex items-center justify-center lg-animate-float">
                                    <i className="bi bi-inbox text-5xl text-green-400" />
                                </div>
                                <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø­Ø³Ø§Ø¨Ø§Øª</h4>
                                <p className="text-sm text-gray-500">Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø­Ø³Ø§Ø¨Ø§Øª ØªØ·Ø§Ø¨Ù‚ Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø¨Ø­Ø«</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="px-4 py-4 font-bold text-right">#</th>
                                            <th className="px-4 py-4 font-bold text-right">Ø§Ù„Ø­Ø³Ø§Ø¨</th>
                                            <th className="px-4 py-4 font-bold text-right">Ø§Ù„Ù†ÙˆØ¹</th>
                                            <th className="px-4 py-4 font-bold text-left text-green-600">Ù…Ø¯ÙŠÙ†</th>
                                            <th className="px-4 py-4 font-bold text-left text-red-500">Ø¯Ø§Ø¦Ù†</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {filteredAccounts.map((acc, idx) => {
                                            const balance = acc.total_debit - acc.total_credit;
                                            return (
                                                <tr key={acc.account_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-alllg-animate-fade-up stagger-${Math.min(idx + 1, 8)}`}>
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
                                            <td colSpan="3" className="px-4 py-4 font-bold">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</td>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6lg-animate-fade">
                    <div className="lg-card overflow-hidden">
                        <div className="bg-green-600 text-white px-5 py-4"><h5 className="font-bold flex items-center gap-2"><i className="bi bi-arrow-up-circle" />Ø£Ø±ØµØ¯Ø© Ù…Ø¯ÙŠÙ†Ø©</h5></div>
                        <div className="p-5">{debitAccounts.length > 0 ? (<div style={{ height: '350px' }}><Chart type="donut" options={debitChartOptions} series={debitChartSeries} /></div>) : (<div className="text-center py-12 text-gray-400"><i className="bi bi-pie-chart text-6xl block mb-4 opacity-25" /><p>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø±ØµØ¯Ø© Ù…Ø¯ÙŠÙ†Ø©</p></div>)}</div>
                    </div>
                    <div className="lg-card overflow-hidden">
                        <div className="bg-red-500 text-white px-5 py-4"><h5 className="font-bold flex items-center gap-2"><i className="bi bi-arrow-down-circle" />Ø£Ø±ØµØ¯Ø© Ø¯Ø§Ø¦Ù†Ø©</h5></div>
                        <div className="p-5">{creditAccounts.length > 0 ? (<div style={{ height: '350px' }}><Chart type="donut" options={creditChartOptions} series={creditChartSeries} /></div>) : (<div className="text-center py-12 text-gray-400"><i className="bi bi-pie-chart text-6xl block mb-4 opacity-25" /><p>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø±ØµØ¯Ø© Ø¯Ø§Ø¦Ù†Ø©</p></div>)}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrialBalance;

