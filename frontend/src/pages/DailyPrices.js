import React, { useState, useEffect, useMemo } from 'react';
import { getDailyPrices, createDailyPrice } from '../api/daily_prices';
import { getCrops } from '../api/crops';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, ActionButton, SearchBox, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

const DailyPrices = () => {
    const { showSuccess, showError } = useToast();
    const [prices, setPrices] = useState([]);
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filters, setFilters] = useState({
        crop_id: '',
        start_date: '',
        end_date: ''
    });
    const [formData, setFormData] = useState({
        crop_id: '',
        price_date: new Date().toISOString().split('T')[0],
        opening_price: '',
        high_price: '',
        low_price: '',
        closing_price: '',
        average_price: '',
        trading_volume: '',
        market_condition: '',
        notes: ''
    });

    useEffect(() => {
        fetchCrops();
        fetchPrices();
    }, []);

    const fetchCrops = async () => {
        try {
            const data = await getCrops();
            setCrops(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPrices = async () => {
        try {
            setLoading(true);
            const data = await getDailyPrices(filters.crop_id || null, filters.start_date || null, filters.end_date || null);
            setPrices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const today = prices.filter(p => {
            const d = new Date(p.price_date).toDateString();
            return d === new Date().toDateString();
        }).length;
        const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + (p.average_price || 0), 0) / prices.length : 0;
        return { total: prices.length, today, avgPrice };
    }, [prices]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleFormChange = (e) => {
        const value = e.target.name.includes('price') || e.target.name === 'trading_volume' ? parseFloat(e.target.value) || '' : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createDailyPrice({ ...formData, crop_id: parseInt(formData.crop_id) });
            showSuccess('تم إضافة السعر بنجاح');
            setShowForm(false);
            setFormData({
                crop_id: '', price_date: new Date().toISOString().split('T')[0], opening_price: '', high_price: '',
                low_price: '', closing_price: '', average_price: '', trading_volume: '', market_condition: '', notes: ''
            });
            fetchPrices();
        } catch (err) {
            showError('فشل في إضافة السعر');
        }
    };

    const getMarketBadge = (condition) => {
        switch (condition) {
            case 'مرتفع': return { className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: 'bi-arrow-up' };
            case 'منخفض': return { className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: 'bi-arrow-down' };
            case 'مستقر': return { className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: 'bi-dash' };
            default: return { className: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400', icon: 'bi-question' };
        }
    };

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/30 dark:to-amber-800/30" />
                </div>
                <div className="neumorphic p-6"><LoadingCard rows={6} /></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title="الأسعار اليومية"
                subtitle="تتبع أسعار المحاصيل في السوق"
                icon="bi-graph-up-arrow"
                gradient="from-orange-500 to-amber-500"
                actions={
                    <ActionButton
                        label={showForm ? 'إلغاء' : 'إضافة سعر يومي'}
                        icon={showForm ? 'bi-x-lg' : 'bi-plus-lg'}
                        onClick={() => setShowForm(!showForm)}
                        variant={showForm ? 'danger' : 'primary'}
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-graph-up-arrow text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي الأسعار</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-calendar-day text-lg text-orange-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">أسعار اليوم</p>
                                <p className="text-lg font-bold">{stats.today}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-cash-coin text-lg text-amber-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">متوسط السعر</p>
                                <p className="text-lg font-bold">{stats.avgPrice.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Filters */}
            <div className="neumorphic p-4 mb-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">المحصول</label>
                        <select className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="crop_id" value={filters.crop_id} onChange={handleFilterChange}>
                            <option value="">الكل</option>
                            {crops.map(crop => <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
                        <input type="date" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
                        <input type="date" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
                    </div>
                    <div className="flex items-end">
                        <button onClick={fetchPrices} className="w-full px-6 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-bold hover-scale">
                            <i className="bi bi-search ml-2" /> بحث
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="mb-6 neumorphic overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className="bi bi-plus-circle-fill ml-2 text-orange-600 dark:text-orange-400" />
                            إضافة سعر يومي جديد
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">المحصول *</label>
                                <select className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="crop_id" value={formData.crop_id} onChange={handleFormChange} required>
                                    <option value="">اختر المحصول</option>
                                    {crops.map(crop => <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ *</label>
                                <input type="date" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="price_date" value={formData.price_date} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">سعر الافتتاح *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="opening_price" value={formData.opening_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">أعلى سعر *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="high_price" value={formData.high_price} onChange={handleFormChange} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">أقل سعر *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="low_price" value={formData.low_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">سعر الإغلاق *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="closing_price" value={formData.closing_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">متوسط السعر *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="average_price" value={formData.average_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">حالة السوق</label>
                                <select className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" name="market_condition" value={formData.market_condition} onChange={handleFormChange}>
                                    <option value="">---</option>
                                    <option value="مرتفع">مرتفع</option>
                                    <option value="منخفض">منخفض</option>
                                    <option value="مستقر">مستقر</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">إلغاء</button>
                            <button type="submit" className="px-8 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-bold hover-scale">
                                <i className="bi bi-check-lg ml-2" /> حفظ
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Prices Table */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-table text-orange-500" />
                        سجل الأسعار
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">{prices.length}</span>
                    </h5>
                </div>
                <div>
                    {prices.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-graph-up-arrow text-5xl text-orange-400 dark:text-orange-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد أسعار</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">ابدأ بتسجيل أسعار المحاصيل</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-4 font-bold text-right">التاريخ</th>
                                        <th className="px-4 py-4 font-bold text-right">المحصول</th>
                                        <th className="px-4 py-4 font-bold text-right">الافتتاح</th>
                                        <th className="px-4 py-4 font-bold text-right">الأعلى</th>
                                        <th className="px-4 py-4 font-bold text-right">الأدنى</th>
                                        <th className="px-4 py-4 font-bold text-right">الإغلاق</th>
                                        <th className="px-4 py-4 font-bold text-right">المتوسط</th>
                                        <th className="px-4 py-4 font-bold text-right">حالة السوق</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {prices.map((price, idx) => {
                                        const badge = getMarketBadge(price.market_condition);
                                        return (
                                            <tr key={price.price_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{new Date(price.price_date).toLocaleDateString('ar-EG')}</td>
                                                <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-200">{price.crop?.crop_name}</td>
                                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{price.opening_price?.toFixed(2)}</td>
                                                <td className="px-4 py-4 text-green-600 dark:text-green-400 font-bold">{price.high_price?.toFixed(2)}</td>
                                                <td className="px-4 py-4 text-red-600 dark:text-red-400 font-bold">{price.low_price?.toFixed(2)}</td>
                                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{price.closing_price?.toFixed(2)}</td>
                                                <td className="px-4 py-4 font-bold text-orange-600 dark:text-orange-400">{price.average_price?.toFixed(2)}</td>
                                                <td className="px-4 py-4">
                                                    {price.market_condition ? (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${badge.className}`}>
                                                            <i className={`bi ${badge.icon}`} />{price.market_condition}
                                                        </span>
                                                    ) : '-'}
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
};

export default DailyPrices;
