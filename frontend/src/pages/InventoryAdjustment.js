import React, { useState, useEffect } from 'react';
import { getInventory, createInventoryAdjustment } from '../api/inventory';
import { useNavigate } from 'react-router-dom';

const InventoryAdjustment = () => {
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [formData, setFormData] = useState({
        crop_id: '',
        adjustment_date: new Date().toISOString().split('T')[0],
        adjustment_type: 'SPOILAGE', // Default
        quantity_kg: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        try {
            const data = await getInventory();
            // Extract crops from inventory data
            const cropList = data.map(item => item.crop);
            setCrops(cropList);
        } catch (err) {
            setError("Failed to load crops.");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation logic
        let quantity = parseFloat(formData.quantity_kg);
        if (isNaN(quantity) || quantity === 0) {
            setError("Please enter a valid quantity.");
            setLoading(false);
            return;
        }

        // Adjust quantity sign based on type
        // SPOILAGE/SHORTAGE = Negative
        // SURPLUS = Positive
        if (formData.adjustment_type === 'SPOILAGE' || formData.adjustment_type === 'SHORTAGE') {
            quantity = -Math.abs(quantity);
        } else {
            quantity = Math.abs(quantity);
        }

        const payload = {
            ...formData,
            crop_id: parseInt(formData.crop_id),
            quantity_kg: quantity
        };

        try {
            await createInventoryAdjustment(payload);
            navigate('/inventory'); // Redirect to inventory list
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to create adjustment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2>تسوية المخزون</h2>
            <form onSubmit={handleSubmit} className="card card-body mt-3">
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3">
                    <label className="form-label">المحصول</label>
                    <select
                        className="form-select"
                        name="crop_id"
                        value={formData.crop_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">اختر المحصول...</option>
                        {crops.map(crop => (
                            <option key={crop.crop_id} value={crop.crop_id}>
                                {crop.crop_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">تاريخ التسوية</label>
                    <input
                        type="date"
                        className="form-control"
                        name="adjustment_date"
                        value={formData.adjustment_date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">نوع التسوية</label>
                    <select
                        className="form-select"
                        name="adjustment_type"
                        value={formData.adjustment_type}
                        onChange={handleChange}
                    >
                        <option value="SPOILAGE">تالف (Spoilage)</option>
                        <option value="SHORTAGE">عجز (Shortage)</option>
                        <option value="SURPLUS">زيادة (Surplus)</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">الكمية (كجم)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="quantity_kg"
                        value={formData.quantity_kg}
                        onChange={handleChange}
                        placeholder="أدخل الكمية (قيمة موجبة)"
                        required
                    />
                    <div className="form-text">أدخل الكمية دائمًا كرقم موجب. سيقوم النظام بتحديد الإشارة بناءً على نوع التسوية.</div>
                </div>

                <div className="mb-3">
                    <label className="form-label">ملاحظات</label>
                    <textarea
                        className="form-control"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'جاري الحفظ...' : 'حفظ التسوية'}
                </button>
            </form>
        </div>
    );
};

export default InventoryAdjustment;
