import React, { useState, useEffect, useCallback } from 'react';
import { getGeneralLedger } from '../api/reports';
import { createManualEntry } from '../api/journal';
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, AlertToast, Card } from '../components/common';
import { JournalForm } from '../components/journal';
import { formatCurrency, formatDate } from '../utils';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const GeneralLedger = () => {
    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError,
        successMessage,
        showSuccess,
        clearMessages
    } = usePageState();

    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [stats, setStats] = useState({
        totalDebit: 0,
        totalCredit: 0,
        entriesCount: 0,
        uniqueAccounts: 0
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [showEntryForm, setShowEntryForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 20;

    const fetchAccounts = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/financial-accounts/');
            const data = await response.json();
            setAccounts(data);
        } catch (err) {
            console.error("Failed to fetch accounts", err);
        }
    };

    const fetchLedger = useCallback(async () => {
        startLoading();
        try {
            const data = await getGeneralLedger();
            setEntries(data);

            const totalDebit = data.reduce((sum, e) => sum + (e.debit || 0), 0);
            const totalCredit = data.reduce((sum, e) => sum + (e.credit || 0), 0);
            const uniqueAccounts = [...new Set(data.filter(e => e.account).map(e => e.account.account_id))].length;

            setStats({
                totalDebit,
                totalCredit,
                entriesCount: data.length,
                uniqueAccounts
            });

        } catch (err) {
            showError('فشل في تحميل بيانات دفتر الأستاذ');
            console.error(err);
        } finally {
            stopLoading();
        }
    }, [startLoading, stopLoading, showError]);

    useEffect(() => {
        fetchLedger();
        fetchAccounts();
    }, []);

    useEffect(() => {
        let result = [...entries];

        if (searchTerm) {
            result = result.filter(e =>
                e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.account?.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedAccount) {
            result = result.filter(e => e.account?.account_id === parseInt(selectedAccount));
        }

        if (startDate) {
            result = result.filter(e => new Date(e.entry_date) >= startDate);
        }

        if (endDate) {
            result = result.filter(e => new Date(e.entry_date) <= endDate);
        }

        setFilteredEntries(result);
        setCurrentPage(1);
    }, [entries, searchTerm, selectedAccount, startDate, endDate]);

    const handleCreateEntry = async (entryData) => {
        startLoading();
        clearMessages();
        try {
            await createManualEntry(entryData);
            showSuccess('تم إضافة القيد المحاسبي بنجاح');
            setShowEntryForm(false);
            fetchLedger();
        } catch (err) {
            showError(err.message || 'فشل إضافة القيد');
        } finally {
            stopLoading();
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedAccount('');
        setStartDate(null);
        setEndDate(null);
    };

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <PageHeader
                    title="دفتر الأستاذ العام"
                    subtitle="سجل شامل لجميع القيود والمعاملات المالية"
                    icon="bi-journal-bookmark"
                />
                <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${showEntryForm ? 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    onClick={() => {
                        setShowEntryForm(!showEntryForm);
                        clearMessages();
                    }}
                >
                    <i className={`bi ${showEntryForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
                    {showEntryForm ? 'إغلاق النموذج' : 'قيد جديد'}
                </button>
            </div>

            {/* Notifications */}
            <AlertToast message={successMessage} type="success" onClose={clearMessages} />
            {error && !showEntryForm && <AlertToast message={error} type="error" onClose={clearMessages} />}

            {/* Statistics Row */}
            {!isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-green-500">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalDebit)}</div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">إجمالي المدين (Debit)</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-red-500">
                        <div className="text-2xl font-bold text-red-500 dark:text-red-400">{formatCurrency(stats.totalCredit)}</div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">إجمالي الدائن (Credit)</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-emerald-500">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.entriesCount}</div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">عدد القيود</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border-r-4 border-cyan-500">
                        <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.uniqueAccounts}</div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">حسابات نشطة</span>
                    </div>
                </div>
            )}

            {/* New Entry Form Area */}
            {isLoading && showEntryForm ? (
                <PageLoading text="جاري المعالجة..." />
            ) : (
                showEntryForm && (
                    <JournalForm
                        accounts={accounts}
                        onSubmit={handleCreateEntry}
                        onCancel={() => setShowEntryForm(false)}
                    />
                )
            )}

            {/* Main Content Area */}
            {isLoading && !showEntryForm ? (
                <PageLoading text="جاري تحميل القيود..." />
            ) : (
                <>
                    {/* Filters */}
                    <Card className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">بحث</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                                    placeholder="الوصف أو اسم الحساب..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الحساب</label>
                                <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                                    value={selectedAccount}
                                    onChange={e => setSelectedAccount(e.target.value)}
                                >
                                    <option value="">الكل</option>
                                    {accounts.map(acc => (
                                        <option key={acc.account_id} value={acc.account_id}>
                                            {acc.account_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">من</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={date => setStartDate(date)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                                    placeholderText="تاريخ البداية"
                                    dateFormat="yyyy-MM-dd"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">إلى</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={date => setEndDate(date)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                                    placeholderText="تاريخ النهاية"
                                    dateFormat="yyyy-MM-dd"
                                />
                            </div>
                            <div>
                                <button className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" onClick={clearFilters}>
                                    إعادة تعيين
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Table */}
                    <Card title={`سجل القيود (${filteredEntries.length})`} icon="bi-table">
                        {filteredEntries.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                لا توجد قيود لعرضها.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '50px' }}>#</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '120px' }}>التاريخ</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الحساب</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الوصف</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-green-600 dark:text-green-400">مدين</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-red-500 dark:text-red-400">دائن</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {currentEntries.map((entry, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-400">{entry.entry_id}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                                                        {formatDate(entry.entry_date)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{entry.account?.account_name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[250px] truncate" title={entry.description}>
                                                    {entry.description}
                                                </td>
                                                <td className="px-4 py-3 text-left text-green-600 dark:text-green-400">
                                                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-left text-red-500 dark:text-red-400">
                                                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6 gap-1">
                                <button
                                    className={`px-3 py-1 rounded border border-gray-300 dark:border-slate-600 text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-slate-700'} text-gray-700 dark:text-gray-300`}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    السابق
                                </button>
                                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={i}
                                            className={`px-3 py-1 rounded border text-sm ${currentPage === pageNum ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    className={`px-3 py-1 rounded border border-gray-300 dark:border-slate-600 text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-slate-700'} text-gray-700 dark:text-gray-300`}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    التالي
                                </button>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
};

export default GeneralLedger;
