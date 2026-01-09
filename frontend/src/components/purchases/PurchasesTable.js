import React from 'react';

/**
 * Table component for displaying purchases list
 */
function PurchasesTable({
    purchases,
    onRecordPayment,
    onEdit,
    onDelete,
    getStatusBadge
}) {

    const MobileCard = ({ purchase }) => {
        const originalUnit = purchase.purchasing_pricing_unit || 'kg';
        const factor = purchase.conversion_factor || 1.0;
        const originalQty = (purchase.quantity_kg || 0) / factor;
        const originalPrice = (purchase.unit_price || 0) * factor;

        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800">
                            <i className="bi bi-flower1 me-1.5 opacity-75"></i>
                            {purchase.crop?.crop_name || 'N/A'}
                        </span>
                        <div className="flex items-center max-w-[120px]">
                            <i className="bi bi-truck text-xs text-indigo-500 me-1"></i>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                {purchase.supplier?.name || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        {getStatusBadge(purchase.payment_status)}
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
                        <span className="font-bold text-red-600 dark:text-red-400">{purchase.total_cost?.toLocaleString('en-US')} ج.م</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-2">
                    <button
                        className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md transition-colors border border-amber-200 dark:border-amber-800"
                        onClick={() => onEdit(purchase)}
                    >
                        <i className="bi bi-pencil me-1.5"></i> تعديل
                    </button>
                    <button
                        className={`flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${purchase.payment_status === 'PAID' ? 'text-gray-400 bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700 cursor-not-allowed' : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800'}`}
                        onClick={() => onRecordPayment(purchase)}
                        disabled={purchase.payment_status === 'PAID'}
                    >
                        <i className="bi bi-cash me-1.5"></i> تسجيل دفعة
                    </button>
                    <button
                        className="col-span-2 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors border border-red-200 dark:border-red-800"
                        onClick={() => onDelete(purchase)}
                    >
                        <i className="bi bi-trash me-1.5"></i> حذف الشراء
                    </button>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                    <div className="flex items-center">
                        <i className="bi bi-calendar3 me-1"></i>
                        {new Date(purchase.purchase_date).toLocaleDateString('en-GB')}
                    </div>
                    <div className="flex items-center">
                        <i className="bi bi-person-circle me-1"></i>
                        {purchase.creator ? purchase.creator.full_name : 'غير محدد'}
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
                            <th scope="col" className="w-[12%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">المحصول</th>
                            <th scope="col" className="w-[18%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">المورد</th>
                            <th scope="col" className="w-[10%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">الكمية</th>
                            <th scope="col" className="w-[10%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">السعر</th>
                            <th scope="col" className="w-[12%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">الإجمالي</th>
                            <th scope="col" className="w-[12%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">بواسطة</th>
                            <th scope="col" className="w-[10%] px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">التاريخ</th>
                            <th scope="col" className="w-[8%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">الحالة</th>
                            <th scope="col" className="w-[8%] px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700 transition-colors">
                        {purchases.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <i className="bi bi-inbox text-4xl mb-2 opacity-50"></i>
                                        <p>لا توجد مشتريات مسجلة</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            purchases.map(p => {
                                const originalUnit = p.purchasing_pricing_unit || 'kg';
                                const factor = p.conversion_factor || 1.0;
                                const originalQty = (p.quantity_kg || 0) / factor;
                                const originalPrice = (p.unit_price || 0) * factor;

                                return (
                                    <tr key={p.purchase_id} className="group hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-800 transition-colors">
                                                <i className="bi bi-flower1 me-1.5 opacity-75"></i>
                                                {p.crop?.crop_name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium transition-colors">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 me-2 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                                                    <i className="bi bi-truck text-sm"></i>
                                                </div>
                                                <span className="truncate max-w-[120px]" title={p.supplier?.name}>
                                                    {p.supplier?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 transition-colors tabular-nums tracking-tight">{originalQty.toFixed(0)}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase transition-colors">{originalUnit}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-900 dark:text-gray-100 transition-colors tabular-nums">{originalPrice.toLocaleString('en-US')}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 transition-colors">/{originalUnit}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400 transition-colors tabular-nums">
                                                {(p.total_cost ?? 0).toLocaleString('en-US')}
                                                <span className="text-xs font-normal text-gray-400 ms-1">ج.م</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors">
                                            <div className="flex items-center justify-end">
                                                <span className="truncate max-w-[100px]" title={p.creator ? p.creator.full_name : 'غير محدد'}>
                                                    {p.creator ? p.creator.full_name : 'غير محدد'}
                                                </span>
                                                <i className="bi bi-person-circle text-gray-300 dark:text-gray-600 ms-1.5 text-xs"></i>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors text-right tabular-nums">
                                            {new Date(p.purchase_date).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                                            {getStatusBadge(p.payment_status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex justify-center items-center space-x-1 space-x-reverse opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-all duration-200 transform lg:translate-y-1 lg:group-hover:translate-y-0">
                                                <button
                                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30"
                                                    onClick={() => onEdit(p)}
                                                    title="تعديل"
                                                >
                                                    <i className="bi bi-pencil block"></i>
                                                </button>
                                                <button
                                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                                                    onClick={() => onDelete(p)}
                                                    title="حذف"
                                                >
                                                    <i className="bi bi-trash block"></i>
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg transition-colors border border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-100 dark:hover:border-emerald-900/30"
                                                    onClick={() => onRecordPayment(p)}
                                                    disabled={p.payment_status === 'PAID'}
                                                    title="تسجيل دفعة"
                                                >
                                                    <i className="bi bi-cash block"></i>
                                                </button>
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
                {purchases.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <i className="bi bi-inbox text-4xl mb-2 opacity-50 block"></i>
                        <p>لا توجد مشتريات مسجلة</p>
                    </div>
                ) : (
                    purchases.map(p => <MobileCard key={p.purchase_id} purchase={p} />)
                )}
            </div>
        </>
    );
}

export default PurchasesTable;
