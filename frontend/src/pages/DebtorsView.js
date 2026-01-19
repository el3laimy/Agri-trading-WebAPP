import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDebtAnalysis } from '../api/reports';
import html2canvas from 'html2canvas';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

function DebtorsView() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('type') === 'payables' ? 'payables' : 'receivables';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [debtData, setDebtData] = useState({ receivables: [], payables: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const tableRef = useRef(null);

    useEffect(() => { fetchDebtData(); }, []);

    const fetchDebtData = async () => {
        setLoading(true);
        try {
            const data = await getDebtAnalysis();
            setDebtData(data);
        } catch (err) {
            setError("فشل تحميل بيانات المديونية");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(amount || 0);

    const currentData = activeTab === 'receivables' ? debtData.receivables : debtData.payables;
    const filteredData = currentData.filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.phone?.includes(searchTerm));
    const totalAmount = filteredData.reduce((sum, item) => sum + (item.balance_due || 0), 0);

    const handlePrint = () => window.print();

    const handleShareText = () => {
        const title = activeTab === 'receivables' ? 'مستحقات من العملاء' : 'مستحقات للموردين';
        let message = `📋 ${title}\n━━━━━━━━━━━━━━━━━\n`;
        filteredData.forEach((item, idx) => {
            message += `${idx + 1}. ${item.name}\n   المبلغ: ${formatCurrency(item.balance_due)}\n`;
            if (item.phone) message += `   الهاتف: ${item.phone}\n`;
            message += `\n`;
        });
        message += `━━━━━━━━━━━━━━━━━\n📊 الإجمالي: ${formatCurrency(totalAmount)}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShareImage = async () => {
        if (!tableRef.current) return;
        try {
            const canvas = await html2canvas(tableRef.current, { backgroundColor: '#ffffff', scale: 2 });
            canvas.toBlob(async (blob) => {
                try {
                    if (navigator.share && navigator.canShare({ files: [new File([blob], 'debtors.png', { type: 'image/png' })] })) {
                        await navigator.share({ files: [new File([blob], 'debtors.png', { type: 'image/png' })], title: activeTab === 'receivables' ? 'مستحقات من العملاء' : 'مستحقات للموردين' });
                    } else {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${activeTab === 'receivables' ? 'مستحقات_العملاء' : 'مستحقات_الموردين'}.png`;
                        a.click();
                    }
                } catch (shareError) { console.error('Share failed:', shareError); }
            }, 'image/png');
        } catch (err) { console.error('Failed to create image:', err); }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-red-200 to-rose-200 dark:from-red-800/30 dark:to-rose-800/30" />
                </div>
                <div className="neumorphic p-6"><LoadingCard rows={8} /></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic p-6 border-r-4 border-red-500 animate-fade-in">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                        <i className="bi bi-exclamation-triangle-fill text-2xl" />
                        <span className="font-bold">{error}</span>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">
                        <i className="bi bi-arrow-right ml-2" />العودة للرئيسية
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto" dir="rtl">
            {/* Page Header */}
            <PageHeader
                title="إدارة المديونيات"
                subtitle="تتبع مستحقات العملاء والتزامات الموردين بدقة"
                icon="bi-cash-coin"
                gradient={activeTab === 'receivables' ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'}
                actions={
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/dashboard')} className="px-4 py-2.5 rounded-xl border border-white/30 text-white hover:bg-white/10">
                            <i className="bi bi-arrow-right ml-2" />رجوع
                        </button>
                        <ActionButton label="طباعة" icon="bi-printer" onClick={handlePrint} variant="primary" />
                        <div className="relative group">
                            <button className="px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
                                <i className="bi bi-whatsapp" />مشاركة
                            </button>
                            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-2 hidden group-hover:block z-50">
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg" onClick={handleShareText}>
                                    <i className="bi bi-chat-text" />إرسال كنص
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg" onClick={handleShareImage}>
                                    <i className="bi bi-image" />إرسال كصورة
                                </button>
                            </div>
                        </div>
                    </div>
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-person-check text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">عملاء مدينين</p>
                                <p className="text-lg font-bold">{debtData.receivables?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-truck text-lg text-red-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">موردين دائنين</p>
                                <p className="text-lg font-bold">{debtData.payables?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-arrow-down-circle text-lg text-emerald-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">لنا</p>
                                <p className="text-lg font-bold">{formatCurrency(debtData.receivables?.reduce((s, i) => s + (i.balance_due || 0), 0))}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-arrow-up-circle text-lg text-rose-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">علينا</p>
                                <p className="text-lg font-bold">{formatCurrency(debtData.payables?.reduce((s, i) => s + (i.balance_due || 0), 0))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip label="مستحقات من العملاء" count={debtData.receivables?.length || 0} icon="bi-person-check" active={activeTab === 'receivables'} onClick={() => setActiveTab('receivables')} color="emerald" />
                <FilterChip label="مستحقات للموردين" count={debtData.payables?.length || 0} icon="bi-truck" active={activeTab === 'payables'} onClick={() => setActiveTab('payables')} color="rose" />
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="w-full md:w-96" />
            </div>

            {/* Summary */}
            <div className={`neumorphic p-4 mb-6 border-r-4 ${activeTab === 'receivables' ? 'border-emerald-500' : 'border-red-500'} animate-fade-in`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${activeTab === 'receivables' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'} flex items-center justify-center`}>
                            <i className="bi bi-graph-up-arrow text-xl" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">إجمالي المديونية في هذه القائمة</p>
                            <h4 className={`text-xl font-black ${activeTab === 'receivables' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(totalAmount)}</h4>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-lg">آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}</span>
                </div>
            </div>

            {/* Table */}
            <div className="neumorphic overflow-hidden animate-fade-in" ref={tableRef}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className={`bi ${activeTab === 'receivables' ? 'bi-person-lines-fill text-emerald-500' : 'bi-truck text-red-500'}`} />
                        {activeTab === 'receivables' ? 'قائمة العملاء المدينين' : 'قائمة الموردين الدائنين'}
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300">{filteredData.length}</span>
                    </h5>
                </div>
                <div>
                    {filteredData.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-check2-circle text-5xl text-emerald-400" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">
                                {searchTerm ? 'لا توجد نتائج بحث' : 'تهانينا! لا توجد مديونيات'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm ? 'حاول استخدام كلمات بحث أخرى' : 'جميع الحسابات في هذه القائمة مصفاة'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-center">#</th>
                                        <th className="px-6 py-4 font-bold text-right">الطرف الثاني</th>
                                        <th className="px-6 py-4 font-bold text-center">إجمالي المعاملات</th>
                                        <th className="px-6 py-4 font-bold text-center">التحصيلات</th>
                                        <th className="px-6 py-4 font-bold text-center">المستحق</th>
                                        <th className="px-6 py-4 font-bold text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredData.map((item, idx) => (
                                        <tr key={idx} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)} group`}>
                                            <td className="px-6 py-4 text-center text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">{item.name?.charAt(0) || '?'}</div>
                                                    <div>
                                                        <div className="font-bold text-gray-800 dark:text-gray-100">{item.name}</div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1"><i className="bi bi-telephone text-[10px]" />{item.phone || 'بدون هاتف'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">{formatCurrency(item.total_amount || item.total_sales || item.total_purchases)}</td>
                                            <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-400">{formatCurrency(item.paid_amount || item.total_received || item.total_paid)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${activeTab === 'receivables' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                                    {formatCurrency(item.balance_due)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => navigate(`/contacts/${item.contact_id || idx}`)} className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50" title="التفاصيل">
                                                        <i className="bi bi-eye-fill" />
                                                    </button>
                                                    {item.phone && (
                                                        <a href={`https://wa.me/${item.phone.replace(/\D/g, '').startsWith('01') ? '2' + item.phone.replace(/\D/g, '') : item.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50" title="واتساب">
                                                            <i className="bi bi-whatsapp" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DebtorsView;
