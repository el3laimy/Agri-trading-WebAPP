import React, { useState, useEffect } from 'react';
import { getCrops } from '../api/crops';
import { deleteInventoryAdjustment } from '../api/inventory';
import { useToast, ConfirmationModal } from '../components/common';
import { PageHeader, LoadingCard } from '../components/common/PageHeader';
import { handleApiError, VALIDATION_MESSAGES } from '../utils';
import axios from 'axios';
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function CardexReport() {
    const { showSuccess, showError } = useToast();
    const [crops, setCrops] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [cardexData, setCardexData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cropsLoading, setCropsLoading] = useState(true);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        try {
            const data = await getCrops();
            setCrops(data.filter(c => c.is_active));
        } catch (error) {
            showError(handleApiError(error, 'crop_fetch'));
        } finally {
            setCropsLoading(false);
        }
    };

    const fetchCardex = async () => {
        if (!selectedCrop) {
            showError('يرجى اختيار محصول');
            return;
        }

        setLoading(true);
        try {
            let url = `/api/v1/inventory/${selectedCrop}/cardex`;
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await axios.get(url);
            setCardexData(response.data);
        } catch (error) {
            showError(handleApiError(error, 'report_fetch'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setDeletingId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteInventoryAdjustment(deletingId);
            showSuccess('تم حذف التسوية بنجاح');
            fetchCardex();
            setShowDeleteConfirm(false);
            setDeletingId(null);
        } catch (error) {
            showError(handleApiError(error, 'delete_adjustment'));
        }
    };

    const getDirectionBadge = (direction) => {
        if (direction === 'IN') {
            return <span className="lg-badge px-2 py-1 text-xs font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: 'rgb(22,163,74)' }}>وارد</span>;
        }
        return <span className="lg-badge px-2 py-1 text-xs font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: 'rgb(220,38,38)' }}>صادر</span>;
    };

    const getTypeBadge = (type) => {
        const colors = {
            'PURCHASE': { bg: 'rgba(59,130,246,0.15)', color: 'rgb(37,99,235)' },
            'SALE': { bg: 'rgba(245,158,11,0.15)', color: 'rgb(217,119,6)' },
            'ADJUSTMENT': { bg: 'rgba(168,85,247,0.15)', color: 'rgb(147,51,234)' },
            'TRANSFORM_IN': { bg: 'rgba(20,184,166,0.15)', color: 'rgb(13,148,136)' },
            'TRANSFORM_OUT': { bg: 'rgba(249,115,22,0.15)', color: 'rgb(234,88,12)' }
        };
        const c = colors[type] || { bg: 'rgba(107,114,128,0.15)', color: 'rgb(75,85,99)' };
        return <span className="lg-badge px-2 py-1 text-xs font-medium" style={{ background: c.bg, color: c.color }}>{cardexData?.movements?.find(m => m.type === type)?.type_ar || type}</span>;
    };

    if (cropsLoading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card p-6"><LoadingCard rows={4} /></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            <PageHeader
                title="كارديكس المخزون"
                subtitle="تقرير حركة الصنف التفصيلي"
                icon="bi bi-card-list"
                gradient="from-teal-500 to-cyan-500"
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف هذه التسوية المخزنية؟ سيتم عكس التأثير المالي والمخزني."
                confirmText="حذف"
                variant="danger"
            />

            {/* Filters */}
            <div className="lg-card p-6 mb-6 lg-animate-fade">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>المحصول *</label>
                        <select
                            value={selectedCrop}
                            onChange={(e) => setSelectedCrop(e.target.value)}
                            className="w-full p-3 lg-input rounded-xl"
                        >
                            <option value="">-- اختر محصول --</option>
                            {crops.map(crop => (
                                <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>من تاريخ</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 lg-input rounded-xl"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>إلى تاريخ</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 lg-input rounded-xl"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchCardex}
                            disabled={loading || !selectedCrop}
                            className="w-full lg-btn lg-btn-primary px-6 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <><i className="bi bi-arrow-repeat animate-spin ml-2" />جاري التحميل...</> : <><i className="bi bi-search ml-2" />عرض الكارديكس</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {cardexData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 lg-animate-fade">
                    <div className="lg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}>
                                <i className="bi bi-box-seam text-teal-600" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>المحصول</p>
                                <p className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>{cardexData.crop_name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                <i className="bi bi-arrow-down-circle text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>إجمالي الوارد</p>
                                <p className="font-bold text-green-600">{cardexData.total_in?.toLocaleString()} كجم</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                <i className="bi bi-arrow-up-circle text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>إجمالي الصادر</p>
                                <p className="font-bold text-red-600">{cardexData.total_out?.toLocaleString()} كجم</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                                <i className="bi bi-wallet2 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--lg-text-muted)' }}>الرصيد الحالي</p>
                                <p className="font-bold text-blue-600">{cardexData.current_balance?.toLocaleString()} كجم</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Movements Table */}
            {cardexData && (
                <div className="lg-card overflow-hidden lg-animate-fade">
                    <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                        <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                            <i className="bi bi-list-ul text-teal-500" />
                            سجل الحركات
                            <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(20,184,166,0.15)', color: 'rgb(13,148,136)' }}>
                                {cardexData.movements_count} حركة
                            </span>
                        </h5>
                    </div>
                    {cardexData.movements?.length === 0 ? (
                        <div className="text-center py-12 lg-animate-fade">
                            <i className="bi bi-inbox text-4xl mb-4" style={{ color: 'var(--lg-text-muted)' }} />
                            <p style={{ color: 'var(--lg-text-muted)' }}>لا توجد حركات في الفترة المحددة</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-right">التاريخ</th>
                                        <th className="px-4 py-3 font-bold text-right">النوع</th>
                                        <th className="px-4 py-3 font-bold text-right">الاتجاه</th>
                                        <th className="px-4 py-3 font-bold text-right">الكمية (كجم)</th>
                                        <th className="px-4 py-3 font-bold text-right">السعر</th>
                                        <th className="px-4 py-3 font-bold text-right">القيمة</th>
                                        <th className="px-4 py-3 font-bold text-right">الرصيد</th>
                                        <th className="px-4 py-3 font-bold text-right">المرجع</th>
                                        <th className="px-4 py-3 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {cardexData.movements?.map((m, idx) => (
                                        <tr key={idx} className="transition-all lg-animate-in" style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.date}</td>
                                            <td className="px-4 py-3">{getTypeBadge(m.type)}</td>
                                            <td className="px-4 py-3">{getDirectionBadge(m.direction)}</td>
                                            <td className={`px-4 py-3 font-bold ${m.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                {m.direction === 'IN' ? '+' : '-'}{m.quantity_kg?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.unit_cost?.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium" style={{ color: 'var(--lg-text-primary)' }}>{m.total_value?.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-bold text-blue-600">{m.balance_kg?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.reference}</td>
                                            <td className="px-4 py-3">
                                                {m.type === 'ADJUSTMENT' && m.id && (
                                                    <button
                                                        onClick={() => handleDelete(m.id)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        title="حذف الحركة"
                                                    >
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!cardexData && !loading && (
                <div className="lg-card p-12 text-center lg-animate-fade">
                    <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                        <i className="bi bi-card-list text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                    </div>
                    <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>اختر محصول لعرض الكارديكس</h4>
                    <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>سيتم عرض جميع الحركات على المحصول المحدد</p>
                </div>
            )}
        </div>
    );
}

export default CardexReport;
