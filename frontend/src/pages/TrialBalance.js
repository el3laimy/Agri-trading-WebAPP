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
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

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

    // Filter logic
    useEffect(() => {
        let result = [...accounts];

        // Search filter
        if (searchTerm) {
            result = result.filter(acc =>
                acc.account_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Account type filter
        if (accountTypeFilter) {
            result = result.filter(acc => acc.account_type === accountTypeFilter);
        }

        // Zero balance filter
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
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Get unique account types
    const accountTypes = [...new Set(accounts.map(acc => acc.account_type).filter(Boolean))];

    // Account type labels in Arabic
    const accountTypeLabels = {
        'asset': 'أصول',
        'liability': 'خصوم',
        'equity': 'حقوق ملكية',
        'revenue': 'إيرادات',
        'expense': 'مصروفات',
        'cash': 'نقدية',
        'receivable': 'ذمم مدينة',
        'payable': 'ذمم دائنة'
    };

    // Chart data
    const debitAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit > 0);
    const creditAccounts = filteredAccounts.filter(acc => acc.total_debit - acc.total_credit < 0);

    const debitChartData = {
        labels: debitAccounts.slice(0, 8).map(acc => acc.account_name),
        datasets: [{
            data: debitAccounts.slice(0, 8).map(acc => acc.total_debit - acc.total_credit),
            backgroundColor: [
                '#1E5631', '#28A745', '#3D8B4F', '#4CAF50',
                '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'
            ],
            borderWidth: 0
        }]
    };

    const creditChartData = {
        labels: creditAccounts.slice(0, 8).map(acc => acc.account_name),
        datasets: [{
            data: creditAccounts.slice(0, 8).map(acc => Math.abs(acc.total_debit - acc.total_credit)),
            backgroundColor: [
                '#DC3545', '#E53935', '#F44336', '#EF5350',
                '#E57373', '#EF9A9A', '#FFCDD2', '#FFEBEE'
            ],
            borderWidth: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { family: 'Cairo', size: 11 },
                    usePointStyle: true,
                    padding: 10
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label}: ${formatCurrency(context.raw)}`
                }
            }
        },
        cutout: '60%'
    };

    // Print function
    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>ميزان المراجعة - ${asOfDate.toLocaleDateString('ar-EG')}</title>
                <style>
                    body { font-family: 'Cairo', sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background-color: #1E5631; color: white; }
                    .text-success { color: #28A745; }
                    .text-danger { color: #DC3545; }
                    tfoot { font-weight: bold; background-color: #f5f5f5; }
                    h1 { color: #1E5631; text-align: center; }
                    .header-info { text-align: center; color: #666; margin-bottom: 20px; }
                    @media print { body { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <h1>ميزان المراجعة</h1>
                <p class="header-info">بتاريخ: ${asOfDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Export to CSV
    const exportToCsv = () => {
        const headers = ['الحساب', 'نوع الحساب', 'مدين', 'دائن'];
        const rows = filteredAccounts.map(acc => {
            const balance = acc.total_debit - acc.total_credit;
            return [
                acc.account_name,
                accountTypeLabels[acc.account_type] || acc.account_type || '-',
                balance > 0 ? balance.toFixed(2) : '',
                balance < 0 ? (-balance).toFixed(2) : ''
            ];
        });
        rows.push(['الإجمالي', '', totals.debit.toFixed(2), totals.credit.toFixed(2)]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trial_balance_${asOfDate.toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Balance check
    const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p className="text-muted">جاري تحميل ميزان المراجعة...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h2 className="mb-1">
                        <i className="bi bi-calculator me-2 text-primary"></i>
                        ميزان المراجعة
                    </h2>
                    <p className="text-muted mb-0">عرض أرصدة جميع الحسابات</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <div className="btn-group">
                        <button
                            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('table')}
                        >
                            <i className="bi bi-table me-1"></i>جدول
                        </button>
                        <button
                            className={`btn ${viewMode === 'chart' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setViewMode('chart')}
                        >
                            <i className="bi bi-pie-chart me-1"></i>رسم بياني
                        </button>
                    </div>
                    <button className="btn btn-outline-success" onClick={exportToCsv}>
                        <i className="bi bi-download me-1"></i>تصدير
                    </button>
                    <button className="btn btn-outline-secondary" onClick={handlePrint}>
                        <i className="bi bi-printer me-1"></i>طباعة
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>{error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm" style={{ borderRight: '4px solid #28A745' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">إجمالي المدين</h6>
                                    <h4 className="mb-0 text-success">{formatCurrency(totals.debit)}</h4>
                                </div>
                                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                                    <i className="bi bi-arrow-up-circle text-success fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm" style={{ borderRight: '4px solid #DC3545' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">إجمالي الدائن</h6>
                                    <h4 className="mb-0 text-danger">{formatCurrency(totals.credit)}</h4>
                                </div>
                                <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                                    <i className="bi bi-arrow-down-circle text-danger fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className={`card border-0 shadow-sm`} style={{ borderRight: `4px solid ${isBalanced ? '#28A745' : '#FFC107'}` }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-1">حالة التوازن</h6>
                                    <h4 className={`mb-0 ${isBalanced ? 'text-success' : 'text-warning'}`}>
                                        {isBalanced ? '✓ متوازن' : `فرق: ${formatCurrency(Math.abs(totals.debit - totals.credit))}`}
                                    </h4>
                                </div>
                                <div className={`${isBalanced ? 'bg-success' : 'bg-warning'} bg-opacity-10 p-3 rounded-circle`}>
                                    <i className={`bi ${isBalanced ? 'bi-check-circle' : 'bi-exclamation-triangle'} ${isBalanced ? 'text-success' : 'text-warning'} fs-4`}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label">
                                <i className="bi bi-search me-1"></i>بحث
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="بحث في اسم الحساب..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">
                                <i className="bi bi-funnel me-1"></i>نوع الحساب
                            </label>
                            <select
                                className="form-select"
                                value={accountTypeFilter}
                                onChange={e => setAccountTypeFilter(e.target.value)}
                            >
                                <option value="">جميع الأنواع</option>
                                {accountTypes.map(type => (
                                    <option key={type} value={type}>
                                        {accountTypeLabels[type] || type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">
                                <i className="bi bi-calendar me-1"></i>بتاريخ
                            </label>
                            <DatePicker
                                selected={asOfDate}
                                onChange={date => setAsOfDate(date)}
                                className="form-control"
                                dateFormat="yyyy-MM-dd"
                            />
                        </div>
                        <div className="col-md-3">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="showZeroBalance"
                                    checked={showZeroBalance}
                                    onChange={e => setShowZeroBalance(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="showZeroBalance">
                                    عرض الأرصدة الصفرية
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'table' ? (
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <i className="bi bi-list-ul me-2"></i>
                            تفاصيل الحسابات
                            <span className="badge bg-secondary ms-2">{filteredAccounts.length}</span>
                        </h5>
                    </div>
                    <div className="card-body p-0" ref={printRef}>
                        {filteredAccounts.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                                <h5 className="text-muted mt-3">لا توجد حسابات</h5>
                                <p className="text-muted">لم يتم العثور على حسابات تطابق معايير البحث</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '5%' }}>#</th>
                                            <th style={{ width: '45%' }}>الحساب</th>
                                            <th style={{ width: '15%' }}>النوع</th>
                                            <th style={{ width: '17.5%' }} className="text-end">مدين</th>
                                            <th style={{ width: '17.5%' }} className="text-end">دائن</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAccounts.map((acc, index) => {
                                            const balance = acc.total_debit - acc.total_credit;
                                            return (
                                                <tr key={acc.account_id}>
                                                    <td className="text-muted">{index + 1}</td>
                                                    <td>
                                                        <span className="fw-medium">{acc.account_name}</span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">
                                                            {accountTypeLabels[acc.account_type] || acc.account_type || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        {balance > 0 && (
                                                            <span className="text-success fw-medium">
                                                                {formatCurrency(balance)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        {balance < 0 && (
                                                            <span className="text-danger fw-medium">
                                                                {formatCurrency(-balance)}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="table-dark">
                                        <tr>
                                            <td colSpan="3"><strong>الإجمالي</strong></td>
                                            <td className="text-end">
                                                <strong>{formatCurrency(totals.debit)}</strong>
                                            </td>
                                            <td className="text-end">
                                                <strong>{formatCurrency(totals.credit)}</strong>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-success text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-arrow-up-circle me-2"></i>
                                    أرصدة مدينة
                                </h5>
                            </div>
                            <div className="card-body">
                                {debitAccounts.length > 0 ? (
                                    <div style={{ height: '350px' }}>
                                        <Doughnut data={debitChartData} options={chartOptions} />
                                    </div>
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-pie-chart display-4 mb-3 d-block opacity-25"></i>
                                        <p>لا توجد أرصدة مدينة</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-danger text-white">
                                <h5 className="mb-0">
                                    <i className="bi bi-arrow-down-circle me-2"></i>
                                    أرصدة دائنة
                                </h5>
                            </div>
                            <div className="card-body">
                                {creditAccounts.length > 0 ? (
                                    <div style={{ height: '350px' }}>
                                        <Doughnut data={creditChartData} options={chartOptions} />
                                    </div>
                                ) : (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-pie-chart display-4 mb-3 d-block opacity-25"></i>
                                        <p>لا توجد أرصدة دائنة</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrialBalance;
