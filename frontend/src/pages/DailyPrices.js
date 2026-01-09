import React, { useState, useEffect } from 'react';
import { getDailyPrices, createDailyPrice } from '../api/daily_prices';
import { getCrops } from '../api/crops';

const DailyPrices = () => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleFormChange = (e) => {
        const value = e.target.name.includes('price') || e.target.name === 'trading_volume' ? parseFloat(e.target.value) || '' : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await createDailyPrice({
                ...formData,
                crop_id: parseInt(formData.crop_id)
            });
            setShowForm(false);
            setFormData({
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
            fetchPrices();
        } catch (err) {
            alert('فشل في إضافة السعر');
            console.error(err);
        }
    };

    return (
        <div className="container mt-4">
            <h2>الأسعار اليومية</h2>

            {/* Filters */}
            <div className="card mb-3">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <label>المحصول</label>
                            <select className="form-select" name="crop_id" value={filters.crop_id} onChange={handleFilterChange}>
                                <option value="">الكل</option>
                                {crops.map(crop => (
                                    <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label>من تاريخ</label>
                            <input type="date" className="form-control" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
                        </div>
                        <div className="col-md-3">
                            <label>إلى تاريخ</label>
                            <input type="date" className="form-control" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                            <button className="btn btn-primary w-100" onClick={fetchPrices}>بحث</button>
                        </div>
                    </div>
                </div>
            </div>

            <button className="btn btn-success mb-3" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'إخفاء النموذج' : 'إضافة سعر يومي'}
            </button>

            {/* Form */}
            {showForm && (
                <div className="card mb-3">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label>المحصول</label>
                                    <select className="form-select" name="crop_id" value={formData.crop_id} onChange={handleFormChange} required>
                                        <option value="">اختر المحصول</option>
                                        {crops.map(crop => (
                                            <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label>التاريخ</label>
                                    <input type="date" className="form-control" name="price_date" value={formData.price_date} onChange={handleFormChange} required />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <label>سعر الافتتاح</label>
                                    <input type="number" step="0.01" className="form-control" name="opening_price" value={formData.opening_price} onChange={handleFormChange} required />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <label>أعلى سعر</label>
                                    <input type="number" step="0.01" className="form-control" name="high_price" value={formData.high_price} onChange={handleFormChange} required />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <label>أقل سعر</label>
                                    <input type="number" step="0.01" className="form-control" name="low_price" value={formData.low_price} onChange={handleFormChange} required />
                                </div>
                                <div className="col-md-3 mb-3">
                                    <label>سعر الإغلاق</label>
                                    <input type="number" step="0.01" className="form-control" name="closing_price" value={formData.closing_price} onChange={handleFormChange} required />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label>متوسط السعر</label>
                                    <input type="number" step="0.01" className="form-control" name="average_price" value={formData.average_price} onChange={handleFormChange} required />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label>حجم التداول (كجم)</label>
                                    <input type="number" step="0.01" className="form-control" name="trading_volume" value={formData.trading_volume} onChange={handleFormChange} />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label>حالة السوق</label>
                                    <select className="form-select" name="market_condition" value={formData.market_condition} onChange={handleFormChange}>
                                        <option value="">---</option>
                                        <option value="مرتفع">مرتفع</option>
                                        <option value="منخفض">منخفض</option>
                                        <option value="مستقر">مستقر</option>
                                    </select>
                                </div>
                                <div className="col-12 mb-3">
                                    <label>ملاحظات</label>
                                    <textarea className="form-control" name="notes" value={formData.notes} onChange={handleFormChange} rows="2"></textarea>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary">حفظ</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <p className="text-center">جاري التحميل...</p>
                    ) : (
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>المحصول</th>
                                    <th>الافتتاح</th>
                                    <th>الأعلى</th>
                                    <th>الأدنى</th>
                                    <th>الإغلاق</th>
                                    <th>المتوسط</th>
                                    <th>حالة السوق</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prices.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center">لا توجد بيانات</td></tr>
                                ) : (
                                    prices.map(price => (
                                        <tr key={price.price_id}>
                                            <td>{new Date(price.price_date).toLocaleDateString('en-US')}</td>
                                            <td>{price.crop?.crop_name}</td>
                                            <td>{price.opening_price.toFixed(2)}</td>
                                            <td>{price.high_price.toFixed(2)}</td>
                                            <td>{price.low_price.toFixed(2)}</td>
                                            <td>{price.closing_price.toFixed(2)}</td>
                                            <td>{price.average_price.toFixed(2)}</td>
                                            <td>{price.market_condition || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyPrices;
