import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContactStatement } from '../api/contacts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Import shared components
import { PageHeader, ActionButton, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function ContactDetails() {
    const { contactId } = useParams();
    const navigate = useNavigate();

    const [statement, setStatement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setMonth(0, 1); return d; });
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => { fetchStatement(); }, [contactId]);

    const fetchStatement = async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = startDate.toISOString().slice(0, 10);
            const endStr = endDate.toISOString().slice(0, 10);
            const data = await getContactStatement(contactId, startStr, endStr);
            console.log("Statement Data:", data); // DEBUG
            if (!data || !data.contact || !data.summary || !data.entries) {
                throw new Error("بيانات كشف الحساب غير مكتملة");
            }
            setStatement(data);
        } catch (err) {
            console.error("Statement Error:", err);
            setError("فشل تحميل كشف الحساب - تأكد من الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        const val = parseFloat(amount);
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP' }).format(isNaN(val) ? 0 : val);
    };
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US');
    };

    const getContactTypeLabel = (type) => {
        switch (type) {
            case 'CUSTOMER': return 'عميل';
            case 'SUPPLIER': return 'مورد';
            case 'BOTH': return 'عميل ومورد';
            default: return type;
        }
    };

    const getContactTypeBadge = (type) => {
        switch (type) {
            case 'CUSTOMER': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
            case 'SUPPLIER': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
            case 'BOTH': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-fuchsia-200 to-pink-200 dark:from-fuchsia-800/30 dark:to-pink-800/30" />
                </div>
                <div className="lg-card p-6"><LoadingCard rows={8} /></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card p-6 border-r-4 border-red-500 lg-animate-fade">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                        <i className="bi bi-exclamation-triangle-fill text-2xl" />
                        <span className="font-bold">{error}</span>
                    </div>
                    <button onClick={() => navigate('/contacts')} className="lg-btn lg-btn-secondary px-4 py-2">
                        <i className="bi bi-arrow-right ml-2" />العودة
                    </button>
                </div>
            </div>
        );
    }

    if (!statement) return null;

    const { contact, summary, entries } = statement;

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title={`كشف حساب: ${contact.name}`}
                subtitle="تفاصيل الحركات المالية مع جهة التعامل"
                icon="bi-person-lines-fill"
                gradient="from-fuchsia-500 to-pink-500"
                actions={
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/contacts')} className="px-4 py-2.5 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all">
                            <i className="bi bi-arrow-right ml-2" />العودة
                        </button>
                        <ActionButton label="طباعة" icon="bi-printer" onClick={() => window.print()} variant="primary" />
                    </div>
                }
            >
                {/* Stats Cards in Header */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '50ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.25)' }}>
                                <i className="bi bi-person text-lg text-fuchsia-500" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>نوع التعامل</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--lg-text-primary)' }}>{getContactTypeLabel(summary.contact_type)}</p>
                            </div>
                        </div>
                    </div>
                    {summary.contact_type !== 'SUPPLIER' && (
                        <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                    <i className="bi bi-cart text-lg text-green-500" />
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>المبيعات</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(summary.total_sales)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {summary.contact_type !== 'CUSTOMER' && (
                        <div className="lg-card px-4 py-3 rounded-xl lg-animate-in" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                                    <i className="bi bi-bag text-lg text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>المشتريات</p>
                                    <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.total_purchases)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={`lg-card px-4 py-3 rounded-xl lg-animate-in ${summary.balance_due >= 0 ? 'ring-2 ring-green-400/50' : 'ring-2 ring-red-400/50'}`} style={{ animationDelay: '150ms' }}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center lg-animate-float`} style={{ background: summary.balance_due >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${summary.balance_due >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                                <i className={`bi ${summary.balance_due >= 0 ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'} text-lg ${summary.balance_due >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>الرصيد</p>
                                <p className={`text-lg font-bold ${summary.balance_due >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Math.abs(summary.balance_due))}</p>
                                <span className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>{summary.balance_due >= 0 ? '💰 لنا' : '⚠️ علينا'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Contact Info */}
            <div className="lg-card p-5 mb-6 lg-animate-fade">
                <h6 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <i className="bi bi-info-circle text-fuchsia-500" />بيانات جهة التعامل
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-100 to-pink-100 dark:from-fuchsia-900/30 dark:to-pink-900/30 flex items-center justify-center">
                            <i className="bi bi-person text-fuchsia-600 dark:text-fuchsia-400 text-xl" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">الاسم</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{contact.name}</p>
                        </div>
                    </div>
                    {contact.phone && (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                                <i className="bi bi-telephone text-blue-600 dark:text-blue-400 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">الهاتف</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200" dir="ltr">{contact.phone}</p>
                            </div>
                        </div>
                    )}
                    {contact.address && (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                                <i className="bi bi-geo-alt text-amber-600 dark:text-amber-400 text-xl" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">العنوان</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">{contact.address}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Date Filter */}
            <div className="lg-card p-5 mb-6 lg-animate-fade">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>من تاريخ</label>
                        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} className="w-full p-3 lg-input rounded-xl" dateFormat="yyyy-MM-dd" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>إلى تاريخ</label>
                        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} className="w-full p-3 lg-input rounded-xl" dateFormat="yyyy-MM-dd" />
                    </div>
                    <div>
                        <button className="w-full lg-btn lg-btn-primary px-6 py-3 font-bold" onClick={fetchStatement}>
                            <i className="bi bi-search ml-2" />عرض الكشف
                        </button>
                    </div>
                </div>
            </div>

            {/* Statement Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-journal-text text-fuchsia-500" />
                        كشف الحساب التفصيلي
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(217,70,239,0.15)', color: 'rgb(192,38,211)' }}>{entries.length}</span>
                    </h5>
                    <span className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>من {formatDate(statement.start_date)} إلى {formatDate(statement.end_date)}</span>
                </div>
                <div>
                    {entries.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-journal-x text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد حركات</h4>
                            <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>لا توجد حركات في هذه الفترة</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-4 font-bold text-center">المبلغ</th>
                                        <th className="px-4 py-4 font-bold text-right">السبب</th>
                                        <th className="px-4 py-4 font-bold text-center">النوع</th>
                                        <th className="px-4 py-4 font-bold text-center">الوزن</th>
                                        <th className="px-4 py-4 font-bold text-center">السعر</th>
                                        <th className="px-4 py-4 font-bold text-center">التاريخ</th>
                                        <th className="px-4 py-4 font-bold text-center">الرصيد</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {entries.map((entry, idx) => {
                                        const debit = parseFloat(entry.debit || 0);
                                        const credit = parseFloat(entry.credit || 0);
                                        const balance = parseFloat(entry.balance || 0);
                                        const amount = debit > 0 ? debit : credit;
                                        const isDebit = debit > 0;
                                        return (
                                            <tr key={idx} className="transition-all lg-animate-in" style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`font-bold text-lg ${isDebit ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {amount?.toLocaleString('en-US') || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{entry.description}</td>
                                                <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">{entry.crop_name || '-'}</td>
                                                <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">{entry.quantity ? parseFloat(entry.quantity).toFixed(0) : '-'}</td>
                                                <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">{entry.unit_price ? parseFloat(entry.unit_price).toLocaleString('en-US') : '-'}</td>
                                                <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-lg text-xs bg-gray-100 dark:bg-slate-600">{formatDate(entry.date)}</span></td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`font-bold ${balance >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {Math.abs(balance).toLocaleString('en-US')}
                                                    </span>
                                                    <span className={`block text-xs ${balance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {balance >= 0 ? 'عليه' : 'له'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContactDetails;
