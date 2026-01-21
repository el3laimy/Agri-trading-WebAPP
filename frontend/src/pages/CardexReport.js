import React, { useState, useEffect } from 'react';
import { getCrops } from '../api/crops';
import { useToast } from '../components/common';
import { PageHeader, LoadingCard } from '../components/common/PageHeader';
import axios from 'axios';
import '../styles/dashboardAnimations.css';

function CardexReport() {
    const { showError } = useToast();
    const [crops, setCrops] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [cardexData, setCardexData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cropsLoading, setCropsLoading] = useState(true);

    useEffect(() => {
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        try {
            const data = await getCrops();
            setCrops(data.filter(c => c.is_active));
        } catch (error) {
            showError('فشل تحميل المحاصيل');
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
            showError('فشل تحميل الكارديكس');
        } finally {
            setLoading(false);
        }
    };

    const getDirectionBadge = (direction) => {
        if (direction === 'IN') {
            return <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">وارد</span>;
        }
        return <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">صادر</span>;
    };

    const getTypeBadge = (type) => {
        const colors = {
            'PURCHASE': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'SALE': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'ADJUSTMENT': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'TRANSFORM_IN': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
            'TRANSFORM_OUT': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        };
        return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>{cardexData?.movements?.find(m => m.type === type)?.type_ar || type}</span>;
    };

    if (cropsLoading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic p-6"><LoadingCard rows={4} /></div>
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

            {/* Filters */}
            <div className="neumorphic p-6 mb-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">المحصول *</label>
                        <select
                            value={selectedCrop}
                            onChange={(e) => setSelectedCrop(e.target.value)}
                            className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                        >
                            <option value="">-- اختر محصول --</option>
                            {crops.map(crop => (
                                <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchCardex}
                            disabled={loading || !selectedCrop}
                            className="w-full px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <><i className="bi bi-arrow-repeat animate-spin ml-2" />جاري التحميل...</> : <><i className="bi bi-search ml-2" />عرض الكارديكس</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {cardexData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
                    <div className="neumorphic p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                                <i className="bi bi-box-seam text-teal-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">المحصول</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">{cardexData.crop_name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="neumorphic p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <i className="bi bi-arrow-down-circle text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الوارد</p>
                                <p className="font-bold text-green-600">{cardexData.total_in?.toLocaleString()} كجم</p>
                            </div>
                        </div>
                    </div>
                    <div className="neumorphic p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <i className="bi bi-arrow-up-circle text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الصادر</p>
                                <p className="font-bold text-red-600">{cardexData.total_out?.toLocaleString()} كجم</p>
                            </div>
                        </div>
                    </div>
                    <div className="neumorphic p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <i className="bi bi-wallet2 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">الرصيد الحالي</p>
                                <p className="font-bold text-blue-600">{cardexData.current_balance?.toLocaleString()} كجم</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Movements Table */}
            {cardexData && (
                <div className="neumorphic overflow-hidden animate-fade-in">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                            <i className="bi bi-list-ul text-teal-500" />
                            سجل الحركات
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                                {cardexData.movements_count} حركة
                            </span>
                        </h5>
                    </div>
                    {cardexData.movements?.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="bi bi-inbox text-4xl text-gray-400 mb-4" />
                            <p className="text-gray-500">لا توجد حركات في الفترة المحددة</p>
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {cardexData.movements?.map((m, idx) => (
                                        <tr key={idx} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.date}</td>
                                            <td className="px-4 py-3">{getTypeBadge(m.type)}</td>
                                            <td className="px-4 py-3">{getDirectionBadge(m.direction)}</td>
                                            <td className={`px-4 py-3 font-bold ${m.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                                {m.direction === 'IN' ? '+' : '-'}{m.quantity_kg?.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.unit_cost?.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{m.total_value?.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-bold text-blue-600">{m.balance_kg?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.reference}</td>
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
                <div className="neumorphic p-12 text-center animate-fade-in">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center animate-float">
                        <i className="bi bi-card-list text-5xl text-teal-500" />
                    </div>
                    <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">اختر محصول لعرض الكارديكس</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">سيتم عرض جميع الحركات على المحصول المحدد</p>
                </div>
            )}
        </div>
    );
}

export default CardexReport;
