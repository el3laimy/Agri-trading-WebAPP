import React, { useState, useEffect } from 'react';
import { getInventory, getCropBatches } from '../api/inventory';
import { useAuth } from '../context/AuthContext';
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, AlertToast, Card } from '../components/common';
import { formatCurrency } from '../utils';

function InventoryView() {
    const { token } = useAuth();

    // Shared Hooks
    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError,
        clearMessages
    } = usePageState();

    const [inventory, setInventory] = useState([]);
    const [expandedCropId, setExpandedCropId] = useState(null);
    const [batches, setBatches] = useState({});
    const [loadingBatches, setLoadingBatches] = useState({});

    useEffect(() => {
        if (token) {
            fetchInventory();
        }
    }, [token]);

    const fetchInventory = async () => {
        startLoading();
        try {
            const data = await getInventory(token);
            setInventory(data);
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
            showError("فشل تحميل بيانات المخزون");
        } finally {
            stopLoading();
        }
    };

    const toggleRow = async (cropId) => {
        if (expandedCropId === cropId) {
            setExpandedCropId(null);
        } else {
            setExpandedCropId(cropId);
            if (!batches[cropId]) {
                setLoadingBatches(prev => ({ ...prev, [cropId]: true }));
                try {
                    const data = await getCropBatches(token, cropId);
                    setBatches(prev => ({ ...prev, [cropId]: data }));
                } catch (err) {
                    console.error("Failed to fetch batches", err);
                    showError("فشل تحميل تفاصيل الدفعات");
                } finally {
                    setLoadingBatches(prev => ({ ...prev, [cropId]: false }));
                }
            }
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader
                title="عرض المخزون"
                subtitle="مراقبة أرصدة المحاصيل وتفاصيل الدفعات (FIFO) وتواريخ الصلاحية"
                icon="bi-box-seam"
            />

            {error && <AlertToast message={error} type="error" onClose={clearMessages} />}

            {isLoading && !inventory.length ? (
                <PageLoading text="جاري جرد المخزون..." />
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right" dir="rtl">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                                    <th className="py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200">المحصول</th>
                                    <th className="py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200 text-center">الكمية الحالية</th>
                                    <th className="py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200 text-center">متوسط التكلفة</th>
                                    <th className="py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200 text-center">القيمة الإجمالية</th>
                                    <th className="py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200 text-center" style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {inventory.map(item => (
                                    <React.Fragment key={item.crop.crop_id}>
                                        <tr
                                            onClick={() => toggleRow(item.crop.crop_id)}
                                            className={`group cursor-pointer transition-colors hover:bg-emerald-50/50 dark:hover:bg-slate-700/50 ${expandedCropId === item.crop.crop_id ? 'bg-emerald-50/30 dark:bg-slate-700/30' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                        <i className="bi bi-flower1"></i>
                                                    </div>
                                                    <span className="mr-3 font-bold text-gray-800 dark:text-gray-100">{item.crop.crop_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.crop.is_complex_unit ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.gross_stock_kg <= (item.low_stock_threshold || 100) ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`} title="الوزن القائم (Physical Gross)">
                                                            {Number(item.gross_stock_kg).toLocaleString('en-US')} كجم (قائم)
                                                        </span>
                                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <i className="bi bi-bag-fill"></i>
                                                            {item.bag_count} عبوة
                                                        </div>
                                                        <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 pt-1 border-t border-gray-100 dark:border-slate-700 w-full" title="صافي الوزن المرجعي (Financial Net)">
                                                            <i className="bi bi-calculator me-1"></i>
                                                            صافي: {Number(item.net_stock_kg).toLocaleString('en-US')} كجم
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${item.current_stock_kg <= (item.low_stock_threshold || 100) ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                                                        {Number(item.current_stock_kg).toLocaleString('en-US')} كجم
                                                    </span>
                                                )}

                                                {(item.current_stock_kg <= (item.low_stock_threshold || 100) || (item.crop.is_complex_unit && item.gross_stock_kg <= (item.low_stock_threshold || 100))) && (
                                                    <div className="text-amber-500 dark:text-amber-400 text-[10px] font-bold mt-1 animate-pulse">
                                                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                                        مخزون منخفض
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(item.average_cost_per_kg)} <small className="opacity-75">/كجم</small>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(item.current_stock_kg * item.average_cost_per_kg)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-400 dark:text-gray-500">
                                                <i className={`bi bi-chevron-${expandedCropId === item.crop.crop_id ? 'up' : 'down'} transition-transform duration-300`}></i>
                                            </td>
                                        </tr>
                                        {expandedCropId === item.crop.crop_id && (
                                            <tr>
                                                <td colSpan="5" className="p-0 border-t border-emerald-100 dark:border-slate-700">
                                                    <div className="bg-emerald-50/20 dark:bg-slate-900/40 p-6 animate-fade-in">
                                                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
                                                            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 border-b border-emerald-100 dark:border-slate-700 flex items-center gap-2">
                                                                <i className="bi bi-layers text-emerald-600 dark:text-emerald-400"></i>
                                                                <h6 className="m-0 text-sm font-bold text-emerald-800 dark:text-emerald-200">تفاصيل الدفعات (نظام FIFO)</h6>
                                                            </div>

                                                            <div className="p-4">
                                                                {loadingBatches[item.crop.crop_id] ? (
                                                                    <div className="flex flex-col items-center py-6 text-emerald-600 dark:text-emerald-400">
                                                                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mb-2"></div>
                                                                        <span className="text-xs font-medium">جاري التحميل...</span>
                                                                    </div>
                                                                ) : batches[item.crop.crop_id] && batches[item.crop.crop_id].length > 0 ? (
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs text-right" dir="rtl">
                                                                            <thead>
                                                                                <tr className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                                                    <th className="pb-3 pr-2">الدفعة #</th>
                                                                                    <th className="pb-3">تاريخ الشراء</th>
                                                                                    <th className="pb-3 text-center">الكمية</th>
                                                                                    <th className="pb-3 text-center">التكلفة (كجم)</th>
                                                                                    <th className="pb-3 text-center">الصلاحية</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                                                                {batches[item.crop.crop_id].map(batch => (
                                                                                    <tr key={batch.batch_id} className="text-gray-600 dark:text-gray-300">
                                                                                        <td className="py-2.5 pr-2 font-mono opacity-60">#{batch.batch_id}</td>
                                                                                        <td className="py-2.5">{batch.purchase_date}</td>
                                                                                        <td className="py-2.5 text-center font-bold">{batch.quantity_kg.toLocaleString('en-US')} كجم</td>
                                                                                        <td className="py-2.5 text-center">{formatCurrency(batch.cost_per_kg)}</td>
                                                                                        <td className="py-2.5 text-center">
                                                                                            {batch.expiry_date ? (
                                                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded ${new Date(batch.expiry_date) < new Date() ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                                                                                                    {batch.expiry_date}
                                                                                                    {new Date(batch.expiry_date) < new Date() && <i className="bi bi-exclamation-circle-fill ms-1"></i>}
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-gray-300 dark:text-gray-600">-</span>
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center py-6 text-gray-400 dark:text-gray-500">
                                                                        <i className="bi bi-info-circle text-2xl mb-2"></i>
                                                                        <p className="text-xs">لا توجد تفاصيل دفعات متاحة (رصيد افتتاحي)</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {inventory.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <i className="bi bi-box2 text-muted mb-3 d-block" style={{ fontSize: '3rem' }}></i>
                                            <p className="text-muted">لا يوجد مخزون مسجل حالياً</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventoryView;
