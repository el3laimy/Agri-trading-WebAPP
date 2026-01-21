import React, { useState, useEffect, useMemo } from 'react';
import { getTransformations, createTransformation, deleteTransformation } from '../api/transformations';
import { getCrops } from '../api/crops';
import { getInventory } from '../api/inventory';
import { useToast } from '../components/common';
import { PageHeader, ActionButton, SearchBox, LoadingCard } from '../components/common/PageHeader';
import '../styles/dashboardAnimations.css';

function TransformationManagement() {
    const { showSuccess, showError } = useToast();
    const [transformations, setTransformations] = useState([]);
    const [crops, setCrops] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        source_crop_id: '',
        source_quantity_kg: '',
        processing_cost: 0,
        transformation_date: new Date().toISOString().split('T')[0],
        notes: '',
        outputs: [{ output_crop_id: '', output_quantity_kg: '', cost_allocation_ratio: '', is_waste: false }]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transformationsData, cropsData, inventoryData] = await Promise.all([
                getTransformations(),
                getCrops(),
                getInventory()
            ]);
            setTransformations(transformationsData);
            setCrops(cropsData);
            setInventory(inventoryData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Get available stock for source crop
    const getAvailableStock = (cropId) => {
        const inv = inventory.find(i => i.crop?.crop_id === parseInt(cropId));
        return inv ? parseFloat(inv.current_stock_kg) : 0;
    };

    // Handle form change
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle output change
    const handleOutputChange = (index, field, value) => {
        const newOutputs = [...formData.outputs];
        newOutputs[index][field] = value;
        setFormData(prev => ({ ...prev, outputs: newOutputs }));
    };

    // Add output row
    const addOutputRow = () => {
        setFormData(prev => ({
            ...prev,
            outputs: [...prev.outputs, { output_crop_id: '', output_quantity_kg: '', cost_allocation_ratio: '', is_waste: false }]
        }));
    };

    // Remove output row
    const removeOutputRow = (index) => {
        if (formData.outputs.length > 1) {
            const newOutputs = formData.outputs.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, outputs: newOutputs }));
        }
    };

    // Calculate total ratio
    const totalRatio = useMemo(() => {
        return formData.outputs.reduce((sum, o) => sum + (parseFloat(o.cost_allocation_ratio) || 0), 0);
    }, [formData.outputs]);

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (totalRatio > 1) {
            showError('مجموع نسب التوزيع يتجاوز 100%');
            return;
        }

        const availableStock = getAvailableStock(formData.source_crop_id);
        if (parseFloat(formData.source_quantity_kg) > availableStock) {
            showError(`المخزون غير كافٍ. المتاح: ${availableStock} كجم`);
            return;
        }

        try {
            const payload = {
                source_crop_id: parseInt(formData.source_crop_id),
                source_quantity_kg: parseFloat(formData.source_quantity_kg),
                processing_cost: parseFloat(formData.processing_cost) || 0,
                transformation_date: formData.transformation_date,
                notes: formData.notes,
                outputs: formData.outputs.map(o => ({
                    output_crop_id: parseInt(o.output_crop_id),
                    output_quantity_kg: parseFloat(o.output_quantity_kg),
                    cost_allocation_ratio: parseFloat(o.cost_allocation_ratio),
                    is_waste: o.is_waste
                }))
            };

            await createTransformation(payload);
            showSuccess('تم إنشاء عملية التحويل بنجاح');
            resetForm();
            fetchData();
        } catch (error) {
            showError(error.response?.data?.detail || 'فشل إنشاء عملية التحويل');
        }
    };

    const resetForm = () => {
        setFormData({
            source_crop_id: '',
            source_quantity_kg: '',
            processing_cost: 0,
            transformation_date: new Date().toISOString().split('T')[0],
            notes: '',
            outputs: [{ output_crop_id: '', output_quantity_kg: '', cost_allocation_ratio: '', is_waste: false }]
        });
        setShowAddForm(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف عملية التحويل؟')) return;
        try {
            await deleteTransformation(id);
            showSuccess('تم حذف عملية التحويل');
            fetchData();
        } catch (error) {
            showError('فشل حذف عملية التحويل');
        }
    };

    // Filter transformations
    const filteredTransformations = useMemo(() => {
        return transformations.filter(t =>
            t.source_crop?.crop_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transformations, searchTerm]);

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-800/30 dark:to-indigo-800/30" />
                </div>
                <div className="neumorphic p-6">
                    <LoadingCard rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            <PageHeader
                title="عمليات التحويل"
                subtitle="تحويل المحاصيل الخام إلى منتجات نهائية"
                icon="bi-arrow-left-right"
                gradient="from-purple-500 to-indigo-500"
                actions={
                    <ActionButton
                        label={showAddForm ? 'إلغاء' : 'عملية تحويل جديدة'}
                        icon={showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}
                        onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
                        variant={showAddForm ? 'danger' : 'primary'}
                    />
                }
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-arrow-left-right text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي العمليات</p>
                                <p className="text-lg font-bold">{transformations.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث عن عملية تحويل..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="mb-6 neumorphic overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className="bi bi-arrow-left-right ml-2 text-purple-600 dark:text-purple-400" />
                            عملية تحويل جديدة
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Source Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    المحصول المصدر (الخام) *
                                </label>
                                <select
                                    value={formData.source_crop_id}
                                    onChange={(e) => handleFormChange('source_crop_id', e.target.value)}
                                    required
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                >
                                    <option value="">-- اختر المحصول --</option>
                                    {crops.map(crop => (
                                        <option key={crop.crop_id} value={crop.crop_id}>
                                            {crop.crop_name} (متاح: {getAvailableStock(crop.crop_id).toFixed(2)} كجم)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    الكمية (كجم) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.source_quantity_kg}
                                    onChange={(e) => handleFormChange('source_quantity_kg', e.target.value)}
                                    required
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    مصاريف التحويل (ج.م)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.processing_cost}
                                    onChange={(e) => handleFormChange('processing_cost', e.target.value)}
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    تاريخ التحويل *
                                </label>
                                <input
                                    type="date"
                                    value={formData.transformation_date}
                                    onChange={(e) => handleFormChange('transformation_date', e.target.value)}
                                    required
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    ملاحظات
                                </label>
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={(e) => handleFormChange('notes', e.target.value)}
                                    className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        {/* Outputs Section */}
                        <div className="neumorphic-inset p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <i className="bi bi-box-arrow-in-down text-purple-500" />
                                    المخرجات (المنتجات الناتجة)
                                </h4>
                                <span className={`text-sm font-bold ${totalRatio > 1 ? 'text-red-500' : totalRatio === 1 ? 'text-green-500' : 'text-amber-500'}`}>
                                    مجموع النسب: {(totalRatio * 100).toFixed(0)}%
                                </span>
                            </div>

                            {formData.outputs.map((output, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-end">
                                    <div className="col-span-4">
                                        <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">
                                            المحصول الناتج
                                        </label>
                                        <select
                                            value={output.output_crop_id}
                                            onChange={(e) => handleOutputChange(index, 'output_crop_id', e.target.value)}
                                            required
                                            className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                        >
                                            <option value="">-- اختر --</option>
                                            {crops.map(crop => (
                                                <option key={crop.crop_id} value={crop.crop_id}>{crop.crop_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">
                                            الكمية (كجم)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={output.output_quantity_kg}
                                            onChange={(e) => handleOutputChange(index, 'output_quantity_kg', e.target.value)}
                                            required
                                            className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">
                                            نسبة التكلفة
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            placeholder="0.80"
                                            value={output.cost_allocation_ratio}
                                            onChange={(e) => handleOutputChange(index, 'cost_allocation_ratio', e.target.value)}
                                            required
                                            className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={output.is_waste}
                                                onChange={(e) => handleOutputChange(index, 'is_waste', e.target.checked)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">هالك</span>
                                        </label>
                                    </div>
                                    <div className="col-span-2 flex gap-2">
                                        {formData.outputs.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOutputRow(index)}
                                                className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addOutputRow}
                                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 mt-2"
                            >
                                <i className="bi bi-plus-circle" /> إضافة مخرج آخر
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">
                                إلغاء
                            </button>
                            <button type="submit" className="px-8 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold hover-scale">
                                <i className="bi bi-check-lg ml-2" />
                                تنفيذ التحويل
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-purple-500" />
                        سجل عمليات التحويل
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                            {filteredTransformations.length}
                        </span>
                    </h5>
                </div>
                <div>
                    {filteredTransformations.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-arrow-left-right text-5xl text-purple-400 dark:text-purple-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد عمليات تحويل</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">قم بإنشاء أول عملية تحويل</p>
                            <button onClick={() => setShowAddForm(true)} className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium bg-purple-600 text-white hover:bg-purple-700 hover-scale">
                                <i className="bi bi-plus-lg ml-2" />
                                عملية تحويل جديدة
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-right">#</th>
                                        <th className="px-6 py-4 font-bold text-right">التاريخ</th>
                                        <th className="px-6 py-4 font-bold text-right">المصدر</th>
                                        <th className="px-6 py-4 font-bold text-right">المخرجات</th>
                                        <th className="px-6 py-4 font-bold text-right">التكلفة</th>
                                        <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredTransformations.map((t, idx) => (
                                        <tr key={t.transformation_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{t.transformation_id}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{t.transformation_date}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{t.source_crop?.crop_name}</span>
                                                    <span className="text-xs text-gray-500">({parseFloat(t.source_quantity_kg).toLocaleString()} كجم)</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {t.outputs?.map((o, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className={`text-xs ${o.is_waste ? 'text-red-500' : 'text-green-600'}`}>
                                                                {o.output_crop?.crop_name}: {parseFloat(o.output_quantity_kg).toLocaleString()} كجم
                                                                <span className="text-gray-400 mr-1">({(parseFloat(o.cost_allocation_ratio) * 100).toFixed(0)}%)</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">
                                                {parseFloat(t.total_cost).toLocaleString()} ج.م
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleDelete(t.transformation_id)} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="حذف">
                                                    <i className="bi bi-trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TransformationManagement;
