import React, { useState, useEffect } from 'react';
import { getInventory, createInventoryAdjustment } from '../api/inventory';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { useToast } from '../components/common';
import { safeParseFloat } from '../utils/mathUtils';
import { handleApiError, VALIDATION_MESSAGES } from '../utils';
import '../styles/dashboardAnimations.css';

const InventoryAdjustment = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [crops, setCrops] = useState([]);
    const [formData, setFormData] = useState({
        crop_id: '',
        adjustment_date: new Date().toISOString().split('T')[0],
        adjustment_type: 'SPOILAGE', // Default
        quantity_kg: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

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
            console.error("Failed to load crops:", err);
            showError(handleApiError(err, 'inventory_fetch'));
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

        // Validation logic
        let quantity = safeParseFloat(formData.quantity_kg);
        if (quantity === 0) {
            showError("يرجى إدخال كمية صحيحة");
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
            showSuccess("تم تسجيل تسوية المخزون بنجاح");
            navigate('/inventory'); // Redirect to inventory list
        } catch (err) {
            console.error(err);
            showError(handleApiError(err, 'inventory_adjust'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-full mx-auto">
            <PageHeader
                title="تسوية مخزون"
                subtitle="تسجيل التالف، العجز، أو الزيادة في المخزون"
                icon="bi-sliders"
                gradient="from-orange-500 to-amber-500"
            />

            <div className="lg-card overflow-hidden lg-animate-fade max-w-3xl mx-auto">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <i className="bi bi-pencil-square ml-2 text-orange-600 dark:text-orange-400" />
                        بيانات التسوية
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">المحصول *</label>
                            <select
                                className="w-full p-3 lg-input rounded-xl"
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

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ التسوية *</label>
                            <input
                                type="date"
                                className="w-full p-3 lg-input rounded-xl"
                                name="adjustment_date"
                                value={formData.adjustment_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">نوع التسوية *</label>
                            <select
                                className="w-full p-3 lg-input rounded-xl"
                                name="adjustment_type"
                                value={formData.adjustment_type}
                                onChange={handleChange}
                            >
                                <option value="SPOILAGE">تالف (Spoilage)</option>
                                <option value="SHORTAGE">عجز (Shortage)</option>
                                <option value="SURPLUS">زيادة (Surplus)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">الكمية (كجم) *</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full p-3 lg-input rounded-xl"
                                name="quantity_kg"
                                value={formData.quantity_kg}
                                onChange={handleChange}
                                placeholder="أدخل الكمية (قيمة موجبة)"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                أدخل الكمية دائماً كرقم موجب. سيتم تحديد الإشارة (سالب/موجب) بناءً على نوع التسوية.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">ملاحظات</label>
                        <textarea
                            className="w-full p-3 lg-input rounded-xl min-h-[100px]"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="سبب التالف، العجز، أو أي تفاصيل أخرى..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => navigate('/inventory')}
                            className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-bold hover-scale transition-all disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري الحفظ...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className="bi bi-check-lg" />
                                    حفظ التسوية
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryAdjustment;
