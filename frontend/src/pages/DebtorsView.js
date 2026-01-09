import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDebtAnalysis } from '../api/reports';
import html2canvas from 'html2canvas';

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

    useEffect(() => {
        fetchDebtData();
    }, []);

    const fetchDebtData = async () => {
        setLoading(true);
        try {
            const data = await getDebtAnalysis();
            setDebtData(data);
        } catch (err) {
            console.error("Failed to fetch debt data:", err);
            setError("فشل تحميل بيانات المديونية");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Filter data based on search
    const currentData = activeTab === 'receivables' ? debtData.receivables : debtData.payables;
    const filteredData = currentData.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.includes(searchTerm)
    );

    // Calculate totals
    const totalAmount = filteredData.reduce((sum, item) => sum + (item.balance_due || 0), 0);

    // Print functionality
    const handlePrint = () => {
        window.print();
    };

    // Share as text via WhatsApp
    const handleShareText = () => {
        const title = activeTab === 'receivables' ? 'مستحقات من العملاء' : 'مستحقات للموردين';
        let message = `📋 ${title}\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;

        filteredData.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   المبلغ: ${formatCurrency(item.balance_due)}\n`;
            if (item.phone) message += `   الهاتف: ${item.phone}\n`;
            message += `\n`;
        });

        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `📊 الإجمالي: ${formatCurrency(totalAmount)}\n`;
        message += `📅 التاريخ: ${new Date().toLocaleDateString('en-US')}`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Share as image via WhatsApp
    const handleShareImage = async () => {
        if (!tableRef.current) return;

        try {
            const canvas = await html2canvas(tableRef.current, {
                backgroundColor: '#ffffff',
                scale: 2
            });

            canvas.toBlob(async (blob) => {
                try {
                    // Try to use the share API if available
                    if (navigator.share && navigator.canShare({ files: [new File([blob], 'debtors.png', { type: 'image/png' })] })) {
                        await navigator.share({
                            files: [new File([blob], 'debtors.png', { type: 'image/png' })],
                            title: activeTab === 'receivables' ? 'مستحقات من العملاء' : 'مستحقات للموردين'
                        });
                    } else {
                        // Fallback: download the image
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${activeTab === 'receivables' ? 'مستحقات_العملاء' : 'مستحقات_الموردين'}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                        alert('تم تحميل الصورة. يمكنك إرسالها عبر الواتساب يدوياً.');
                    }
                } catch (shareError) {
                    console.error('Share failed:', shareError);
                }
            }, 'image/png');
        } catch (err) {
            console.error('Failed to create image:', err);
            alert('فشل إنشاء الصورة');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">جاري تحميل كشوف المديونيات...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-400 p-4 mb-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <i className="bi bi-exclamation-triangle-fill text-red-400 me-3 text-xl"></i>
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium m-0">{error}</p>
                    </div>
                </div>
                <button
                    className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                    onClick={() => navigate('/dashboard')}
                >
                    <i className="bi bi-arrow-right me-2"></i>
                    العودة للرئيسية
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
            {/* Header Area */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-colors no-print">
                <div className="flex items-center gap-4">
                    <button
                        className="p-2 bg-gray-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all border border-gray-100 dark:border-slate-700"
                        onClick={() => navigate('/dashboard')}
                        title="رجوع"
                    >
                        <i className="bi bi-arrow-right text-lg"></i>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-2 m-0">
                            <i className="bi bi-cash-coin text-emerald-600 dark:text-emerald-400"></i>
                            إدارة المديونيات
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">تتبع مستحقات العملاء والتزامات الموردين بدقة</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-bold text-sm shadow-sm"
                        onClick={handlePrint}
                    >
                        <i className="bi bi-printer"></i>
                        طباعة
                    </button>
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold text-sm shadow-md shadow-emerald-500/20">
                            <i className="bi bi-whatsapp"></i>
                            مشاركة
                            <i className="bi bi-chevron-down text-[10px] opacity-70"></i>
                        </button>
                        <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-2 hidden group-hover:block z-50 animate-fade-in">
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 rounded-lg transition-colors" onClick={handleShareText}>
                                <i className="bi bi-chat-text"></i>
                                إرسال كنص
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 rounded-lg transition-colors" onClick={handleShareImage}>
                                <i className="bi bi-image"></i>
                                إرسال كصورة
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end no-print">
                <div className="lg:col-span-7">
                    <div className="bg-gray-100/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-gray-100 dark:border-slate-700 flex gap-1">
                        <button
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'receivables'
                                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-100 dark:border-slate-700'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                }`}
                            onClick={() => setActiveTab('receivables')}
                        >
                            <i className="bi bi-person-check"></i>
                            مستحقات من العملاء
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'receivables' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>
                                {debtData.receivables?.length || 0}
                            </span>
                        </button>
                        <button
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'payables'
                                ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-gray-100 dark:border-slate-700'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                }`}
                            onClick={() => setActiveTab('payables')}
                        >
                            <i className="bi bi-truck"></i>
                            مستحقات للموردين
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'payables' ? 'bg-red-100 dark:bg-red-900/40 text-red-700' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>
                                {debtData.payables?.length || 0}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="relative group">
                        <i className="bi bi-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                        <input
                            type="text"
                            className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm dark:text-gray-100"
                            placeholder="بحث بالاسم أو الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Total Summary Card */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between no-print transition-colors ${activeTab === 'receivables'
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeTab === 'receivables' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-red-100 dark:bg-red-900/40 text-red-600'}`}>
                        <i className="bi bi-graph-up-arrow"></i>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block uppercase tracking-wider">إجمالي المديونية في هذه القائمة</span>
                        <h4 className={`text-xl font-black m-0 ${activeTab === 'receivables' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{formatCurrency(totalAmount)}</h4>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-gray-400 bg-white/50 dark:bg-slate-800 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                    آخر تحديث: {new Date().toLocaleTimeString('en-US')}
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors" ref={tableRef}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/30 dark:bg-slate-900/30">
                    <h5 className="mb-0 font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <i className={`bi ${activeTab === 'receivables' ? 'bi-person-lines-fill' : 'bi-truck'} text-emerald-600 dark:text-emerald-400`}></i>
                        {activeTab === 'receivables' ? 'قائمة العملاء المدينين' : 'قائمة الموردين الدائنين'}
                        <span className="text-xs font-medium text-gray-400">( {filteredData.length} سجل )</span>
                    </h5>
                </div>

                {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="p-6 bg-emerald-50 dark:bg-slate-900 rounded-full mb-4">
                            <i className="bi bi-check2-circle text-5xl text-emerald-400"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 m-0">
                            {searchTerm ? 'لا توجد نتائج بحث تطابق مدخلاتك' : 'تهانينا! لا توجد مديونيات معلقة حالياً'}
                        </h3>
                        <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                            {searchTerm ? 'حاول استخدام كلمات بحث أخرى أو التأكد من الاسم' : 'جميع الحسابات في هذه القائمة متزنة ومصفاة بالكامل.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right" dir="rtl">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4 text-center" style={{ width: '60px' }}>#</th>
                                    <th className="px-6 py-4">الطرف الثاني</th>
                                    <th className="px-6 py-4 text-center">إجمالي المعاملات</th>
                                    <th className="px-6 py-4 text-center">التحصيلات/السداد</th>
                                    <th className="px-6 py-4 text-center">المبلغ المستحق</th>
                                    <th className="px-6 py-4 text-center no-print" style={{ width: '120px' }}>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700 transition-colors">
                                {filteredData.map((item, index) => (
                                    <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 text-center text-xs font-mono text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                                                    {item.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 dark:text-gray-100">{item.name}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <i className="bi bi-telephone text-[10px]"></i>
                                                        {item.phone || 'بدون هاتف'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {formatCurrency(item.total_amount || item.total_sales || item.total_purchases)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(item.paid_amount || item.total_received || item.total_paid)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-black shadow-sm ring-1 ring-inset ${activeTab === 'receivables'
                                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-amber-500/10'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-500/10'
                                                }`}>
                                                {formatCurrency(item.balance_due)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center no-print">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/contacts/${item.contact_id || index}`)}
                                                    className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm transition-all"
                                                    title="التفاصيل"
                                                >
                                                    <i className="bi bi-eye-fill"></i>
                                                </button>
                                                {item.phone && (
                                                    <a
                                                        href={`https://wa.me/${item.phone.replace(/\D/g, '').startsWith('01') ? '2' + item.phone.replace(/\D/g, '') : item.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 shadow-sm transition-all"
                                                        title="واتساب"
                                                    >
                                                        <i className="bi bi-whatsapp"></i>
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
    );
}

export default DebtorsView;
