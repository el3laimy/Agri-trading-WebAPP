import React, { useState, useEffect, useMemo } from 'react';
import { getDailyPrices, createDailyPrice } from '../api/daily_prices';
import { getCrops } from '../api/crops';
import { useToast } from '../components/common';
import { handleApiError } from '../utils';

// Import shared components
import { PageHeader, ActionButton, SearchBox, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

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
            showError(handleApiError(err, 'price_create'));
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
                <div className="lg-card overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/30 dark:to-amber-800/30" />
                </div>
                <div className="lg-card p-6"><LoadingCard rows={6} /></div>
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
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-graph-up-arrow text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي الأسعار</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-calendar-day text-lg text-orange-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">أسعار اليوم</p>
                                <p className="text-lg font-bold">{stats.today}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center lg-animate-float">
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
            <div className="lg-card p-4 mb-6 lg-animate-fade">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>المحصول</label>
                        <select className="w-full p-2.5 lg-input rounded-xl" name="crop_id" value={filters.crop_id} onChange={handleFilterChange}>
                            <option value="">الكل</option>
                            {crops.map(crop => <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>من تاريخ</label>
                        <input type="date" className="w-full p-2.5 lg-input rounded-xl" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>إلى تاريخ</label>
                        <input type="date" className="w-full p-2.5 lg-input rounded-xl" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
                    </div>
                    <div className="flex items-end">
                        <button onClick={fetchPrices} className="w-full lg-btn lg-btn-primary px-6 py-2.5 font-bold">
                            <i className="bi bi-search ml-2" /> بحث
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="mb-6 lg-card overflow-hidden lg-animate-fade">
                    <div className="p-6" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                        <h3 className="text-lg font-bold flex items-center" style={{ color: 'var(--lg-text-primary)' }}>
                            <i className="bi bi-plus-circle-fill ml-2" style={{ color: 'var(--lg-primary)' }} />
                            إضافة سعر يومي جديد
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">المحصول *</label>
                                <select className="w-full p-2.5 lg-input rounded-xl" name="crop_id" value={formData.crop_id} onChange={handleFormChange} required>
                                    <option value="">اختر المحصول</option>
                                    {crops.map(crop => <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ *</label>
                                <input type="date" className="w-full p-2.5 lg-input rounded-xl" name="price_date" value={formData.price_date} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">سعر الافتتاح *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 lg-input rounded-xl" name="opening_price" value={formData.opening_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">أعلى سعر *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 lg-input rounded-xl" name="high_price" value={formData.high_price} onChange={handleFormChange} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">أقل سعر *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 lg-input rounded-xl" name="low_price" value={formData.low_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">سعر الإغلاق *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 lg-input rounded-xl" name="closing_price" value={formData.closing_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">متوسط السعر *</label>
                                <input type="number" step="0.01" className="w-full p-2.5 lg-input rounded-xl" name="average_price" value={formData.average_price} onChange={handleFormChange} required />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">حالة السوق</label>
                                <select className="w-full p-2.5 lg-input rounded-xl" name="market_condition" value={formData.market_condition} onChange={handleFormChange}>
                                    <option value="">---</option>
                                    <option value="مرتفع">مرتفع</option>
                                    <option value="منخفض">منخفض</option>
                                    <option value="مستقر">مستقر</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)' }}>
                            <button type="button" onClick={() => setShowForm(false)} className="lg-btn lg-btn-secondary px-6 py-2.5">إلغاء</button>
                            <button type="submit" className="lg-btn lg-btn-primary px-8 py-2.5 font-bold">
                                <i className="bi bi-check-lg ml-2" /> حفظ
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Prices Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-table text-orange-500" />
                        سجل الأسعار
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(249,115,22,0.15)', color: 'rgb(234,88,12)' }}>{prices.length}</span>
                    </h5>
                </div>
                <div>
                    {prices.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-graph-up-arrow text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد أسعار</h4>
                            <p className="text-sm mb-6" style={{ color: 'var(--lg-text-muted)' }}>ابدأ بتسجيل أسعار المحاصيل</p>
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
                                            <tr key={price.price_id} className="transition-all lg-animate-in" style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{new Date(price.price_date).toLocaleDateString('en-US')}</td>
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
