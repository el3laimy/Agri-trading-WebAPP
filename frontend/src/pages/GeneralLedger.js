import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getGeneralLedger } from '../api/reports';
import { getSeasons } from '../api/seasons';
import { createManualEntry } from '../api/journal';
import { usePageState } from '../hooks';
import { useToast } from '../components/common';
import { JournalForm } from '../components/journal';
import { formatCurrency, formatDate, handleApiError } from '../utils';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Import shared components
import { PageHeader, ActionButton, SearchBox, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

const GeneralLedger = () => {
    const { showSuccess, showError: showToastError } = useToast();
    const { isLoading, startLoading, stopLoading, error, showError, clearMessages } = usePageState();

    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 20;

    const stats = useMemo(() => {
        const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
        const uniqueAccounts = [...new Set(entries.filter(e => e.account).map(e => e.account.account_id))].length;
        return { totalDebit, totalCredit, entriesCount: entries.length, uniqueAccounts };
    }, [entries]);

    const fetchAccounts = async () => {
        try {
            const { getFinancialAccounts } = await import('../api/financialAccounts');
            const data = await getFinancialAccounts();
            setAccounts(data);
        } catch (err) { console.error("Failed to fetch accounts", err); }
    };

    const fetchSeasons = async () => {
        try {
            const data = await getSeasons();
            setSeasons(data);
        } catch (err) { console.error("Failed to fetch seasons", err); }
    };

    const fetchLedger = useCallback(async () => {
        startLoading();
        try {
            const sDate = startDate ? startDate.toISOString().split('T')[0] : null;
            const eDate = endDate ? endDate.toISOString().split('T')[0] : null;
            const accId = selectedAccount || null;

            const data = await getGeneralLedger(sDate, eDate, accId);
            setEntries(data);
            setFilteredEntries(data); // Initial set, will be filtered by search term below
        } catch (err) {
            showError('فشل في تحميل بيانات دفتر الأستاذ');
        } finally { stopLoading(); }
    }, [startLoading, stopLoading, showError, startDate, endDate, selectedAccount]);

    // Fetch accounts and seasons only on mount
    useEffect(() => { fetchAccounts(); fetchSeasons(); }, []);

    // Fetch ledger when filters change
    useEffect(() => { fetchLedger(); }, [fetchLedger]);

    // Client-side filtering for search term only
    useEffect(() => {
        let result = [...entries];
        if (searchTerm) {
            result = result.filter(e =>
                e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.account?.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredEntries(result);
        setCurrentPage(1);
    }, [entries, searchTerm]);

    const handleCreateEntry = async (entryData) => {
        startLoading();
        try {
            await createManualEntry(entryData);
            showSuccess('تم إضافة القيد المحاسبي بنجاح');
            setShowEntryForm(false);
            fetchLedger();
        } catch (err) {
            showToastError(handleApiError(err, 'journal_create'));
        } finally { stopLoading(); }
    };

    const clearFilters = () => { setSearchTerm(''); setSelectedAccount(''); setStartDate(null); setEndDate(null); setSelectedSeason(''); };

    const handleSeasonChange = (e) => {
        const seasonId = e.target.value;
        setSelectedSeason(seasonId);
        if (seasonId) {
            const season = seasons.find(s => s.season_id === parseInt(seasonId));
            if (season) {
                setStartDate(new Date(season.start_date));
                setEndDate(new Date(season.end_date));
            }
        }
    };

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

    if (isLoading && entries.length === 0) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800/30 dark:to-teal-800/30" />
                </div>
                <div className="lg-card p-6"><LoadingCard rows={8} /></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title="دفتر الأستاذ العام"
                subtitle="سجل شامل لجميع القيود والمعاملات المالية"
                icon="bi-journal-bookmark"
                gradient="from-emerald-500 to-teal-500"
                actions={
                    <ActionButton
                        label={showEntryForm ? 'إغلاق النموذج' : 'قيد جديد'}
                        icon={showEntryForm ? 'bi-x-lg' : 'bi-plus-lg'}
                        onClick={() => { setShowEntryForm(!showEntryForm); clearMessages(); }}
                        variant={showEntryForm ? 'danger' : 'primary'}
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '50ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'var(--lg-tint-emerald)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <i className="bi bi-arrow-down-circle text-lg text-green-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>إجمالي المدين</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>{formatCurrency(stats.totalDebit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'var(--lg-tint-rose)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                <i className="bi bi-arrow-up-circle text-lg text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>إجمالي الدائن</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>{formatCurrency(stats.totalCredit)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '150ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'var(--lg-tint-emerald)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <i className="bi bi-journal-text text-lg text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>عدد القيود</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>{stats.entriesCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'var(--lg-tint-blue)', border: '1px solid rgba(6,182,212,0.25)' }}>
                                <i className="bi bi-bank text-lg text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>حسابات نشطة</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>{stats.uniqueAccounts}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Journal Form */}
            {showEntryForm && (
                <div className="mb-6 lg-card overflow-hidden lg-animate-fade">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className="bi bi-plus-circle-fill ml-2 text-emerald-600 dark:text-emerald-400" />
                            إضافة قيد محاسبي جديد
                        </h3>
                    </div>
                    <div className="p-6">
                        <JournalForm accounts={accounts} onSubmit={handleCreateEntry} onCancel={() => setShowEntryForm(false)} />
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="lg-card p-4 mb-6 lg-animate-fade">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">بحث</label>
                        <input type="text" className="w-full p-2.5 lg-input rounded-xl" placeholder="الوصف أو اسم الحساب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">الموسم</label>
                        <select className="w-full p-2.5 lg-input rounded-xl" value={selectedSeason} onChange={handleSeasonChange}>
                            <option value="">تخصيص تاريخ</option>
                            {seasons.map(s => <option key={s.season_id} value={s.season_id}>{s.name} ({s.status})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">الحساب</label>
                        <select className="w-full p-2.5 lg-input rounded-xl" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                            <option value="">الكل</option>
                            {accounts.map(acc => <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">من</label>
                        <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="w-full p-2.5 lg-input rounded-xl" placeholderText="تاريخ البداية" dateFormat="yyyy-MM-dd" />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">إلى</label>
                        <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="w-full p-2.5 lg-input rounded-xl" placeholderText="تاريخ النهاية" dateFormat="yyyy-MM-dd" />
                    </div>
                    <div>
                        <button className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={clearFilters}>
                            إعادة تعيين
                        </button>
                    </div>
                </div>
            </div>

            {/* Entries Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-table text-emerald-500" />
                        سجل القيود
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: 'rgb(5,150,105)' }}>{filteredEntries.length}</span>
                    </h5>
                </div>
                <div>
                    {filteredEntries.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float lg-card">
                                <i className="bi bi-journal-bookmark text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد قيود</h4>
                            <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>لا توجد قيود لعرضها</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="px-4 py-4 font-bold text-right">#</th>
                                            <th className="px-4 py-4 font-bold text-right">التاريخ</th>
                                            <th className="px-4 py-4 font-bold text-right">الحساب</th>
                                            <th className="px-4 py-4 font-bold text-right">الوصف</th>
                                            <th className="px-4 py-4 font-bold text-left text-green-600">مدين</th>
                                            <th className="px-4 py-4 font-bold text-left text-red-500">دائن</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {currentEntries.map((entry, idx) => (
                                            <tr key={idx} className="transition-all lg-animate-in" style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                                <td className="px-4 py-4 text-gray-400">{entry.entry_id}</td>
                                                <td className="px-4 py-4"><span className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300">{formatDate(entry.entry_date)}</span></td>
                                                <td className="px-4 py-4 font-medium text-gray-800 dark:text-gray-200">{entry.account?.account_name}</td>
                                                <td className="px-4 py-4 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{entry.description}</td>
                                                <td className="px-4 py-4 text-left text-green-600 dark:text-green-400 font-bold">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                                <td className="px-4 py-4 text-left text-red-500 dark:text-red-400 font-bold">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center py-4 gap-1 border-t border-gray-100 dark:border-slate-700">
                                    <button className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === 1 ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-slate-700'} text-gray-700 dark:text-gray-300`} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>السابق</button>
                                    {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                        <button key={i} className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === i + 1 ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                    ))}
                                    <button className={`px-3 py-1.5 rounded-lg text-sm ${currentPage === totalPages ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-slate-700'} text-gray-700 dark:text-gray-300`} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>التالي</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneralLedger;
