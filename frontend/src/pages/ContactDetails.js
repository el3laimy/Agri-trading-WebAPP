import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContactStatement } from '../api/contacts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function ContactDetails() {
    const { contactId } = useParams();
    const navigate = useNavigate();

    const [statement, setStatement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(0, 1);
        return date;
    });
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        fetchStatement();
        // eslint-disable-next-line
    }, [contactId]);

    const fetchStatement = async () => {
        setLoading(true);
        setError(null);
        try {
            const startStr = startDate.toISOString().slice(0, 10);
            const endStr = endDate.toISOString().slice(0, 10);
            const data = await getContactStatement(contactId, startStr, endStr);
            setStatement(data);
        } catch (err) {
            setError("فشل تحميل كشف الحساب");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
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

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-4 flex items-center gap-2 mb-4">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {error}
                </div>
                <button className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors flex items-center gap-2" onClick={() => navigate('/contacts')}>
                    <i className="bi bi-arrow-right"></i>
                    العودة
                </button>
            </div>
        );
    }

    if (!statement) return null;

    const { contact, summary, entries } = statement;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <button
                        className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                        onClick={() => navigate('/contacts')}
                    >
                        <i className="bi bi-arrow-right"></i>
                        العودة
                    </button>
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="bi bi-person-circle text-emerald-600"></i>
                        كشف حساب: {contact.name}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getContactTypeBadge(summary.contact_type)}`}>
                        {getContactTypeLabel(summary.contact_type)}
                    </span>
                </div>
                <button className="px-4 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2" onClick={handlePrint}>
                    <i className="bi bi-printer"></i>
                    طباعة
                </button>
            </div>

            {/* Contact Info & Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
                    <h6 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i className="bi bi-info-circle text-emerald-600"></i>
                        بيانات جهة التعامل
                    </h6>
                    <p className="mb-2 text-gray-700 dark:text-gray-300"><strong>الاسم:</strong> {contact.name}</p>
                    {contact.phone && <p className="mb-2 text-gray-700 dark:text-gray-300"><strong>الهاتف:</strong> {contact.phone}</p>}
                    {contact.address && <p className="mb-2 text-gray-700 dark:text-gray-300"><strong>العنوان:</strong> {contact.address}</p>}
                </div>

                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
                    <h6 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <i className="bi bi-graph-up text-green-600"></i>
                        الملخص المالي
                    </h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {summary.contact_type !== 'SUPPLIER' && (
                            <>
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-center bg-gray-50 dark:bg-slate-700">
                                    <small className="text-gray-500 dark:text-gray-400 block">إجمالي المبيعات</small>
                                    <strong className="text-green-600 dark:text-green-400">{formatCurrency(summary.total_sales)}</strong>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-center bg-gray-50 dark:bg-slate-700">
                                    <small className="text-gray-500 dark:text-gray-400 block">المحصل</small>
                                    <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.total_received)}</strong>
                                </div>
                            </>
                        )}
                        {summary.contact_type !== 'CUSTOMER' && (
                            <>
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-center bg-gray-50 dark:bg-slate-700">
                                    <small className="text-gray-500 dark:text-gray-400 block">إجمالي المشتريات</small>
                                    <strong className="text-red-500 dark:text-red-400">{formatCurrency(summary.total_purchases)}</strong>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-center bg-gray-50 dark:bg-slate-700">
                                    <small className="text-gray-500 dark:text-gray-400 block">المدفوع</small>
                                    <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(summary.total_paid)}</strong>
                                </div>
                            </>
                        )}
                        <div
                            className="rounded-lg p-4 text-center shadow-sm text-white"
                            style={{
                                background: summary.balance_due >= 0
                                    ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                    : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
                            }}
                        >
                            <i className={`bi ${summary.balance_due >= 0 ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'} text-3xl mb-2 block opacity-75`}></i>
                            <small className="block opacity-75">الرصيد المستحق</small>
                            <strong className="text-xl block">
                                {formatCurrency(Math.abs(summary.balance_due))}
                            </strong>
                            <span className="inline-block mt-1 bg-white/90 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">
                                {summary.balance_due >= 0 ? '💰 لنا' : '⚠️ علينا'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">من تاريخ</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">إلى تاريخ</label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div>
                        <button
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            onClick={fetchStatement}
                        >
                            <i className="bi bi-search"></i>
                            عرض الكشف
                        </button>
                    </div>
                </div>
            </div>

            {/* Statement Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className="bi bi-journal-text"></i>
                        كشف الحساب التفصيلي
                    </h5>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                        من {formatDate(statement.start_date)} إلى {formatDate(statement.end_date)}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300" style={{ width: '100px' }}>المبلغ</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">السبب</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">النوع</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">الوزن</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">السعر</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">ملاحظات</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        لا توجد حركات في هذه الفترة
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry, index) => {
                                    const amount = entry.debit > 0 ? entry.debit : entry.credit;
                                    const isDebit = entry.debit > 0;

                                    return (
                                        <React.Fragment key={index}>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-bold text-lg ${isDebit ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {amount?.toLocaleString('en-US') || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{entry.description}</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{entry.crop_name || '-'}</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{entry.quantity ? entry.quantity.toFixed(0) : '-'}</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{entry.unit_price ? entry.unit_price.toLocaleString('en-US') : '-'}</td>
                                                <td className="px-4 py-3 text-gray-400">-</td>
                                                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{formatDate(entry.date)}</td>
                                            </tr>
                                            <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`font-bold text-lg ${entry.balance >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {Math.abs(entry.balance)?.toLocaleString('en-US') || 0}
                                                    </span>
                                                </td>
                                                <td colSpan="6" className="px-4 py-2 text-left">
                                                    <strong className={entry.balance >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                                        {entry.balance >= 0 ? 'الباقي عليه' : 'الباقي له'}
                                                    </strong>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ContactDetails;
