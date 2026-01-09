import React from 'react';
import { downloadInvoice } from '../../api/sales';

/**
 * Table component for displaying sales list
 */
function SalesTable({
    sales,
    onRecordPayment,
    onShareWhatsApp,
    onShareEmail,
    onEdit,
    onDelete,
    getStatusBadge
}) {
    // State to track which dropdown is open (by sale_id)
    const [openDropdownId, setOpenDropdownId] = React.useState(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId && !event.target.closest('.dropdown-container')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    const toggleDropdown = (saleId) => {
        setOpenDropdownId(openDropdownId === saleId ? null : saleId);
    };

    const MobileCard = ({ sale }) => {
        const originalUnit = sale.selling_pricing_unit || 'kg';
        const factor = sale.specific_selling_factor || 1.0;
        const originalQty = (sale.quantity_sold_kg || 0) / factor;
        const originalPrice = (sale.selling_unit_price || 0) * factor;

        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 transition-colors">
                            <i className="bi bi-flower1 me-1.5 opacity-75"></i>
                            {sale.crop?.crop_name || 'N/A'}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {sale.customer?.name || 'N/A'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        {getStatusBadge(sale.payment_status)}
                        <div className="relative inline-block text-left dropdown-container">
                            <button
                                onClick={() => toggleDropdown(sale.sale_id)}
                                className={`text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full transition-colors ${openDropdownId === sale.sale_id ? 'bg-gray-100 dark:bg-slate-700' : ''}`}
                            >
                                <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            {openDropdownId === sale.sale_id && (
                                <div className="absolute left-0 top-full mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-20">
                                    <div className="py-1">
                                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => onEdit(sale)}>
                                            <i className="bi bi-pencil me-2 text-amber-500"></i> تعديل
                                        </button>
                                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => onDelete(sale)}>
                                            <i className="bi bi-trash me-2 text-red-500"></i> حذف
                                        </button>
                                        <button
                                            className={`flex w-full items-center px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 ${sale.payment_status === 'PAID' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300'}`}
                                            onClick={() => onRecordPayment(sale)}
                                            disabled={sale.payment_status === 'PAID'}
                                        >
                                            <i className="bi bi-cash me-2 text-emerald-500"></i> تسجيل دفعة
                                        </button>
                                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => downloadInvoice(sale.sale_id)}>
                                            <i className="bi bi-printer me-2 text-blue-500"></i> فاتورة
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => { onShareWhatsApp(sale); setOpenDropdownId(null); }}>
                                            <i className="bi bi-whatsapp me-2 text-green-500"></i> واتساب
                                        </button>
                                        <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => { onShareEmail(sale); setOpenDropdownId(null); }}>
                                            <i className="bi bi-envelope me-2 text-blue-500"></i> بريد
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex flex-col">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">الكمية</span>
                        <span className="font-medium dark:text-gray-200">{originalQty.toFixed(0)} <span className="text-xs">{originalUnit}</span></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">السعر</span>
                        <span className="font-medium dark:text-gray-200">{originalPrice.toLocaleString('en-US')} <span className="text-xs">/{originalUnit}</span></span>
                    </div>
                    <div className="flex flex-col col-span-2">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">الإجمالي</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{sale.total_sale_amount?.toLocaleString('en-US')} ج.م</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                        <i className="bi bi-calendar3 me-1"></i>
                        {new Date(sale.sale_date).toLocaleDateString('en-GB')}
                    </div>
                    <div className="flex items-center">
                        <i className="bi bi-person-circle me-1"></i>
                        {sale.creator ? sale.creator.full_name : 'غير محدد'}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto max-h-[75vh] shadow-sm rounded-lg border border-gray-200 dark:border-slate-700 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 transition-colors relative">
                    <thead className="bg-gray-50 dark:bg-slate-800/90 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th scope="col" className="w-[12%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                المحصول
                            </th>
                            <th scope="col" className="w-[18%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                العميل
                            </th>
                            <th scope="col" className="w-[10%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                الكمية
                            </th>
                            <th scope="col" className="w-[10%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                السعر
                            </th>
                            <th scope="col" className="w-[12%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                الإجمالي
                            </th>
                            <th scope="col" className="w-[12%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                بواسطة
                            </th>
                            <th scope="col" className="w-[10%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                التاريخ
                            </th>
                            <th scope="col" className="w-[8%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                الحالة
                            </th>
                            <th scope="col" className="w-[8%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                إجراءات
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700 transition-colors">
                        {sales.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-4xl mb-2 opacity-50"></i>
                                        <p>لا توجد مبيعات مسجلة</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sales.map(s => {
                                const originalUnit = s.selling_pricing_unit || 'kg';
                                const factor = s.specific_selling_factor || 1.0;
                                const originalQty = (s.quantity_sold_kg || 0) / factor;
                                const originalPrice = (s.selling_unit_price || 0) * factor;

                                return (
                                    <tr key={s.sale_id} className="group hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 transition-colors">
                                                <i className="bi bi-flower1 me-1.5 opacity-75"></i>
                                                {s.crop?.crop_name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium transition-colors">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 me-2 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                                                    <i className="bi bi-person text-sm"></i>
                                                </div>
                                                <span className="truncate max-w-[120px]" title={s.customer?.name}>
                                                    {s.customer?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900 dark:text-gray-100 font-bold transition-colors tabular-nums tracking-tight">{originalQty.toFixed(0)}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{originalUnit}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors tabular-nums">{originalPrice.toLocaleString('en-US')}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400">/{originalUnit}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-colors tabular-nums">
                                                {(s.total_sale_amount || 0).toLocaleString('en-US')}
                                                <span className="text-xs font-normal text-gray-400 ms-1">ج.م</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                                            <div className="flex items-center justify-end">
                                                <span className="truncate max-w-[100px]" title={s.creator ? s.creator.full_name : 'غير محدد'}>
                                                    {s.creator ? s.creator.full_name : 'غير محدد'}
                                                </span>
                                                <i className="bi bi-person-circle text-gray-300 dark:text-gray-600 ms-1.5 text-xs"></i>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors text-right tabular-nums">
                                            {new Date(s.sale_date).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                                            {getStatusBadge(s.payment_status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex justify-center items-center space-x-1 space-x-reverse opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-all duration-200 transform lg:translate-y-1 lg:group-hover:translate-y-0">
                                                <button
                                                    onClick={() => onEdit(s)}
                                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30"
                                                    title="تعديل"
                                                >
                                                    <i className="bi bi-pencil block"></i>
                                                </button>
                                                <button
                                                    onClick={() => onDelete(s)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                                                    title="حذف"
                                                >
                                                    <i className="bi bi-trash block"></i>
                                                </button>
                                                <button
                                                    onClick={() => onRecordPayment(s)}
                                                    disabled={s.payment_status === 'PAID'}
                                                    className={`p-1.5 rounded-lg transition-colors border border-transparent ${s.payment_status === 'PAID'
                                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                                                        : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-100 dark:hover:border-emerald-900/30'
                                                        }`}
                                                    title="تسجيل دفعة"
                                                >
                                                    <i className="bi bi-cash block"></i>
                                                </button>
                                                <button
                                                    onClick={() => downloadInvoice(s.sale_id)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                                                    title="طباعة الفاتورة"
                                                >
                                                    <i className="bi bi-printer block"></i>
                                                </button>

                                                <div className="relative inline-block text-left dropdown-container">
                                                    <button
                                                        onClick={() => toggleDropdown(s.sale_id)}
                                                        className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent ${openDropdownId === s.sale_id ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200' : ''}`}
                                                        title="مشاركة"
                                                    >
                                                        <i className="bi bi-share block"></i>
                                                    </button>

                                                    {openDropdownId === s.sale_id && (
                                                        <div className="absolute left-0 bottom-full mb-2 w-40 rounded-lg shadow-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 ring-1 ring-black ring-opacity-5 z-50 transform origin-bottom-left transition-all">
                                                            <div className="py-1" role="menu" aria-orientation="vertical">
                                                                <button
                                                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                                    onClick={() => { onShareWhatsApp(s); setOpenDropdownId(null); }}
                                                                    role="menuitem"
                                                                >
                                                                    <i className="bi bi-whatsapp text-green-500 dark:text-green-400 me-2.5"></i>
                                                                    واتساب
                                                                </button>
                                                                <button
                                                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                                    onClick={() => { onShareEmail(s); setOpenDropdownId(null); }}
                                                                    role="menuitem"
                                                                >
                                                                    <i className="bi bi-envelope text-blue-500 dark:text-blue-400 me-2.5"></i>
                                                                    بريد إلكتروني
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {sales.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <i className="bi bi-inbox text-4xl mb-2 opacity-50 block"></i>
                        <p>لا توجد مبيعات مسجلة</p>
                    </div>
                ) : (
                    sales.map(s => <MobileCard key={s.sale_id} sale={s} />)
                )}
            </div>
        </>
    );
}

export default SalesTable;
