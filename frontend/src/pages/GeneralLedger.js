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
    // Shared State Management
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

    // Data State
    const [entries, setEntries] = useState([]);
    const [filteredEntries, setFilteredEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [stats, setStats] = useState({
        totalDebit: 0,
        totalCredit: 0,
        entriesCount: 0,
        uniqueAccounts: 0
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // UI State
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 20;

    // Fetch Accounts
    const fetchAccounts = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/financial-accounts/');
            const data = await response.json();
            setAccounts(data);
        } catch (err) {
            console.error("Failed to fetch accounts", err);
        }
    };

    // Fetch Ledger Data
    const fetchLedger = useCallback(async () => {
        startLoading();
        try {
            const data = await getGeneralLedger();
            setEntries(data);

            // Calculate stats immediately
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
    }, []); // Run once on mount

    // Filter Logic
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
        setCurrentPage(1); // Reset pagination on filter change
    }, [entries, searchTerm, selectedAccount, startDate, endDate]);

    const handleCreateEntry = async (entryData) => {
        startLoading();
        clearMessages();
        try {
            await createManualEntry(entryData);
            showSuccess('تم إضافة القيد المحاسبي بنجاح');
            setShowEntryForm(false);
            fetchLedger(); // Refresh data
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

    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <PageHeader
                    title="دفتر الأستاذ العام"
                    subtitle="سجل شامل لجميع القيود والمعاملات المالية"
                    icon="bi-journal-bookmark"
                />
                <button
                    className={`btn ${showEntryForm ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => {
                        setShowEntryForm(!showEntryForm);
                        clearMessages();
                    }}
                >
                    <i className={`bi ${showEntryForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                    {showEntryForm ? 'إغلاق النموذج' : 'قيد جديد'}
                </button>
            </div>

            {/* Notifications */}
            <AlertToast
                message={successMessage}
                type="success"
                onClose={clearMessages}
            />
            {error && !showEntryForm && <AlertToast message={error} type="error" onClose={clearMessages} />}

            {/* Statistics Row */}
            {!isLoading && (
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 border-end border-success border-4">
                            <div className="card-body">
                                <small className="text-muted d-block fw-bold display-6 mb-0 text-success">{formatCurrency(stats.totalDebit)}</small>
                                <span className="text-muted small">إجمالي المدين (Debit)</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 border-end border-danger border-4">
                            <div className="card-body">
                                <small className="text-muted d-block fw-bold display-6 mb-0 text-danger">{formatCurrency(stats.totalCredit)}</small>
                                <span className="text-muted small">إجمالي الدائن (Credit)</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 border-end border-primary border-4">
                            <div className="card-body">
                                <small className="text-muted d-block fw-bold display-6 mb-0 text-primary">{stats.entriesCount}</small>
                                <span className="text-muted small">عدد القيود</span>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card border-0 shadow-sm h-100 border-end border-info border-4">
                            <div className="card-body">
                                <small className="text-muted d-block fw-bold display-6 mb-0 text-info">{stats.uniqueAccounts}</small>
                                <span className="text-muted small">حسابات نشطة</span>
                            </div>
                        </div>
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

            {/* Main Content Area: Loading or Data */}
            {isLoading && !showEntryForm ? (
                <PageLoading text="جاري تحميل القيود..." />
            ) : (
                <>
                    {/* Filters */}
                    <Card className="mb-4">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label className="form-label small fw-bold">بحث</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="الوصف أو اسم الحساب..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label small fw-bold">الحساب</label>
                                <select
                                    className="form-select form-select-sm"
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
                            <div className="col-md-2">
                                <label className="form-label small fw-bold">من</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={date => setStartDate(date)}
                                    className="form-control form-control-sm"
                                    placeholderText="تاريخ البداية"
                                    dateFormat="yyyy-MM-dd"
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label small fw-bold">إلى</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={date => setEndDate(date)}
                                    className="form-control form-control-sm"
                                    placeholderText="تاريخ النهاية"
                                    dateFormat="yyyy-MM-dd"
                                />
                            </div>
                            <div className="col-md-2">
                                <button className="btn btn-outline-secondary btn-sm w-100" onClick={clearFilters}>
                                    إعادة تعيين
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Table */}
                    <Card title={`سجل القيود (${filteredEntries.length})`} icon="bi-table">
                        {filteredEntries.length === 0 ? (
                            <div className="text-center py-5">
                                <p className="text-muted">لا توجد قيود لعرضها.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th style={{ width: '120px' }}>التاريخ</th>
                                            <th>الحساب</th>
                                            <th>الوصف</th>
                                            <th className="text-end text-success">مدين</th>
                                            <th className="text-end text-danger">دائن</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentEntries.map((entry, index) => (
                                            <tr key={index}>
                                                <td className="text-muted small">{entry.entry_id}</td>
                                                <td><span className="badge bg-light text-dark fw-normal">{formatDate(entry.entry_date)}</span></td>
                                                <td className="fw-medium">{entry.account?.account_name}</td>
                                                <td className="text-muted small text-truncate" style={{ maxWidth: '250px' }} title={entry.description}>
                                                    {entry.description}
                                                </td>
                                                <td className="text-end text-success">
                                                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                                </td>
                                                <td className="text-end text-danger">
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
                            <div className="d-flex justify-content-center mt-4">
                                <nav aria-label="Page navigation">
                                    <ul className="pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                                                السابق
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                                                التالي
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
};

export default GeneralLedger;
