import React, { useState, useEffect, useMemo } from 'react';
import { getCrops, createCrop, updateCrop, deleteCrop, migrateAndDeleteCrop, forceDeleteCrop } from '../api/crops';
import { safeParseFloat } from '../utils/mathUtils';
import { handleApiError } from '../utils';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function CropManagement() {
    const { showSuccess, showError } = useToast();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cropName, setCropName] = useState('');
    const [conversionFactors, setConversionFactors] = useState([{ unit: '', factor: '' }]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Deletion & Conflict Handling States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [cropToDelete, setCropToDelete] = useState(null);
    const [conflictData, setConflictData] = useState(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [migrationTarget, setMigrationTarget] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        try {
            setLoading(true);
            const data = await getCrops();
            setCrops(data);
        } catch (error) {
            console.error("Failed to fetch crops:", error);
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const stats = useMemo(() => {
        return { total: crops.length, active: crops.filter(c => c.is_active).length };
    }, [crops]);

    const handleFactorChange = (index, event) => {
        const values = [...conversionFactors];
        values[index][event.target.name] = event.target.value;
        setConversionFactors(values);
    };

    const handleAddFactor = () => {
        setConversionFactors([...conversionFactors, { unit: '', factor: '' }]);
    };

    const handleRemoveFactor = (index) => {
        const values = [...conversionFactors];
        values.splice(index, 1);
        setConversionFactors(values);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const factorsObject = conversionFactors.reduce((acc, curr) => {
                if (curr.unit && curr.factor) {
                    acc[curr.unit] = safeParseFloat(curr.factor);
                }
                return acc;
            }, {});

            const allowed_pricing_units = Object.keys(factorsObject);
            const cropData = {
                crop_name: cropName,
                allowed_pricing_units,
                conversion_factors: factorsObject,
                is_complex_unit: false, // دائماً بسيط
                default_tare_per_bag: 0,
                standard_unit_weight: null
            };

            if (editingCrop) {
                await updateCrop(editingCrop.crop_id, cropData);
                showSuccess('تم تحديث المحصول بنجاح');
            } else {
                await createCrop(cropData);
                showSuccess('تم إضافة المحصول بنجاح');
            }

            fetchCrops();
            resetForm();
        } catch (error) {
            showError(handleApiError(error, 'crop_create'));
        }
    };

    const handleEdit = (crop) => {
        setEditingCrop(crop);
        setCropName(crop.crop_name);

        const factorsArray = Object.entries(crop.conversion_factors).map(([unit, factor]) => ({
            unit,
            factor: factor.toString()
        }));
        setConversionFactors(factorsArray.length > 0 ? factorsArray : [{ unit: '', factor: '' }]);
        setShowAddForm(true);
        // Scroll to top to ensure form is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (crop) => {
        setCropToDelete(crop);
        setConflictData(null);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!cropToDelete) return;
        try {
            // Optimistic update concept can be applied here if using React Query fully, 
            // but for now we stick to standard await to ensure consistency given the complexity of conflicts.
            await deleteCrop(cropToDelete.crop_id);

            // Explicit Success Message
            showSuccess('تم حذف المحصول بنجاح');

            fetchCrops();
            setShowDeleteModal(false);
            setCropToDelete(null);
        } catch (error) {
            console.error("Delete failed:", error);
            if (error.response?.status === 409) {
                setConflictData(error.response.data.conflicts);
                setShowDeleteModal(false);
                setShowConflictModal(true);
                // No error toast needed here, modal explains it
            } else {
                // Explicit Error Message with reason
                const reason = error.response?.data?.detail || 'حدث خطأ غير متوقع أثناء الحذف';
                showError(`فشل حذف المحصول: ${reason}`);

                setShowDeleteModal(false);
                setCropToDelete(null);
            }
        }
    };

    const handleMigrate = async () => {
        if (!cropToDelete || !migrationTarget) return;
        setIsProcessing(true);
        try {
            await migrateAndDeleteCrop(cropToDelete.crop_id, parseInt(migrationTarget));
            await fetchCrops();
            setShowConflictModal(false);
            setCropToDelete(null);
            setConflictData(null);
            setMigrationTarget('');
            showSuccess('تم نقل البيانات وحذف المحصول بنجاح');
        } catch (error) {
            showError(handleApiError(error, 'update'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleForceDelete = async () => {
        if (!cropToDelete) return;
        if (!window.confirm("تحذير: سيتم حذف جميع السجلات المرتبطة نهائياً. هل أنت متأكد؟")) return;

        setIsProcessing(true);
        try {
            await forceDeleteCrop(cropToDelete.crop_id);
            await fetchCrops();
            setShowConflictModal(false);
            setCropToDelete(null);
            setConflictData(null);
            showSuccess('تم حذف المحصول وجميع السجلات المرتبطة');
        } catch (error) {
            showError(handleApiError(error, 'delete'));
        } finally {
            setIsProcessing(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setShowConflictModal(false);
        setCropToDelete(null);
        setConflictData(null);
        setMigrationTarget('');
    };

    const resetForm = () => {
        setCropName('');
        setConversionFactors([{ unit: '', factor: '' }]);
        setShowAddForm(false);
        setEditingCrop(null);
    };

    // Filter crops
    const filteredCrops = useMemo(() => {
        return crops.filter(crop => {
            const matchesSearch = crop.crop_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter === 'all' ? true :
                selectedFilter === 'active' ? crop.is_active : !crop.is_active;
            return matchesSearch && matchesFilter;
        });
    }, [crops, searchTerm, selectedFilter]);

    const availableTargets = crops.filter(c => cropToDelete && c.crop_id !== cropToDelete.crop_id);

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="lg-card overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-lime-200 to-green-200 dark:from-lime-800/30 dark:to-green-800/30" />
                </div>
                <div className="lg-card p-6">
                    <LoadingCard rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="lg-modal-overlay">
                    <div className="lg-modal" style={{ maxWidth: '420px' }}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--lg-text-primary)' }}>تأكيد الحذف</h3>
                            <p className="mb-6" style={{ color: 'var(--lg-text-muted)' }}>
                                هل أنت متأكد من حذف <span className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>"{cropToDelete?.crop_name}"</span>؟
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center px-6 pb-6">
                            <button onClick={cancelDelete} className="lg-btn lg-btn-secondary px-6 py-2.5">
                                إلغاء
                            </button>
                            <button onClick={confirmDelete} className="lg-btn px-6 py-2.5 font-bold text-white" style={{ background: 'rgb(239,68,68)' }}>
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Modal */}
            {showConflictModal && (
                <div className="lg-modal-overlay">
                    <div className="lg-modal" style={{ maxWidth: '640px' }}>
                        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)' }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                <i className="bi bi-diagram-3-fill text-2xl text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold" style={{ color: 'var(--lg-text-primary)' }}>لا يمكن الحذف المباشر</h3>
                                <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>المحصول مرتبط بسجلات أخرى</p>
                            </div>
                        </div>
                        <div className="p-6">
                            {conflictData && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                    {Object.entries(conflictData).map(([key, count]) => (
                                        count > 0 && (
                                            <div key={key} className="p-3 rounded-xl flex justify-between items-center" style={{ background: 'var(--lg-glass-bg)', border: '1px solid var(--lg-glass-border)' }}>
                                                <span className="text-xs font-medium uppercase" style={{ color: 'var(--lg-text-muted)' }}>{key.replace('_', ' ')}</span>
                                                <span className="lg-badge px-2 py-0.5 text-xs font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgb(217,119,6)' }}>{count}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="lg-card p-4">
                                    <div className="flex items-center gap-2 mb-3 font-bold" style={{ color: 'var(--lg-primary)' }}>
                                        <i className="bi bi-arrow-left-right" />
                                        الخيار 1: نقل البيانات (موصى به)
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 p-2.5 lg-input rounded-xl"
                                            value={migrationTarget}
                                            onChange={(e) => setMigrationTarget(e.target.value)}
                                        >
                                            <option value="">-- اختر المحصول البديل --</option>
                                            {availableTargets.map(c => (
                                                <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>
                                            ))}
                                        </select>
                                        <button
                                            className={`lg-btn lg-btn-primary px-4 py-2.5 font-bold ${!migrationTarget || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            onClick={handleMigrate}
                                            disabled={!migrationTarget || isProcessing}
                                        >
                                            {isProcessing ? 'جاري...' : 'نقل وحذف'}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg-card p-4" style={{ border: '2px solid rgba(239,68,68,0.3)' }}>
                                    <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400 font-bold">
                                        <i className="bi bi-trash-fill" />
                                        الخيار 2: الحذف القسري (خطر)
                                    </div>
                                    <button
                                        className={`w-full px-4 py-2.5 rounded-xl font-bold border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 ${isProcessing ? 'opacity-50' : ''}`}
                                        onClick={handleForceDelete}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'جاري الحذف...' : 'حذف المحصول وجميع بياناته'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-6 pt-4 flex justify-end" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)' }}>
                            <button onClick={cancelDelete} disabled={isProcessing} className="lg-btn lg-btn-secondary px-6 py-2.5">
                                إلغاء الأمر
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <PageHeader
                title="إدارة المحاصيل"
                subtitle="إدارة أنواع المحاصيل ووحدات القياس"
                icon="bi-flower1"
                gradient="from-lime-500 to-green-500"
                actions={
                    <ActionButton
                        label={showAddForm ? 'إلغاء' : 'إضافة محصول جديد'}
                        icon={showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}
                        onClick={() => showAddForm ? resetForm() : setShowAddForm(true)}
                        variant={showAddForm ? 'danger' : 'primary'}
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-flower1 text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي المحاصيل</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-check-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">نشط</p>
                                <p className="text-lg font-bold">{stats.active}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث عن محصول..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip label="الكل" count={crops.length} icon="bi-grid" active={selectedFilter === 'all'} onClick={() => setSelectedFilter('all')} color="emerald" />
                <FilterChip label="نشط" count={stats.active} icon="bi-check-circle" active={selectedFilter === 'active'} onClick={() => setSelectedFilter('active')} color="emerald" />
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-6 lg-card overflow-hidden lg-animate-fade">
                    <div className="p-6" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                        <h3 className="text-lg font-bold flex items-center" style={{ color: 'var(--lg-text-primary)' }}>
                            <i className={`bi ${editingCrop ? 'bi-pencil-square' : 'bi-plus-circle-fill'} ml-2`} style={{ color: 'var(--lg-primary)' }} />
                            {editingCrop ? 'تعديل بيانات المحصول' : 'تسجيل محصول جديد'}
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-medium" style={{ color: 'var(--lg-text-secondary)' }}>اسم المحصول *</label>
                            <input
                                type="text"
                                value={cropName}
                                onChange={(e) => setCropName(e.target.value)}
                                required
                                placeholder="مثال: قمح، ذرة، أرز..."
                                className="w-full p-3 lg-input rounded-xl font-bold text-lg"
                            />
                        </div>

                        {/* Conversion Factors */}
                        <div className="mb-6">
                            <h5 className="text-sm font-bold mb-2 flex items-center" style={{ color: 'var(--lg-text-primary)' }}>
                                <i className="bi bi-calculator ml-2" style={{ color: 'var(--lg-primary)' }} />
                                عوامل التحويل (بالنسبة للكيلوجرام)
                            </h5>
                            {conversionFactors.map((factor, index) => (
                                <div className="flex gap-3 mb-3 items-end" key={index}>
                                    <div className="flex-1">
                                        <label className="block mb-1 text-xs font-medium" style={{ color: 'var(--lg-text-muted)' }}>اسم الوحدة</label>
                                        <input type="text" name="unit" placeholder="شكارة، طن" value={factor.unit} onChange={event => handleFactorChange(index, event)} required className="w-full p-2.5 lg-input rounded-xl" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block mb-1 text-xs font-medium" style={{ color: 'var(--lg-text-muted)' }}>الوزن بالكيلو</label>
                                        <input type="number" step="0.01" name="factor" placeholder="50" value={factor.factor} onChange={event => handleFactorChange(index, event)} required className="w-full p-2.5 lg-input rounded-xl" />
                                    </div>
                                    {conversionFactors.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveFactor(index)} className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                                            <i className="bi bi-trash" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddFactor} className="font-medium text-sm flex items-center gap-1 mt-2" style={{ color: 'var(--lg-primary)' }}>
                                <i className="bi bi-plus-circle" /> إضافة وحدة أخرى
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--lg-glass-border-subtle)' }}>
                            <button type="button" onClick={resetForm} className="lg-btn lg-btn-secondary px-6 py-2.5">إلغاء</button>
                            <button type="submit" className="lg-btn lg-btn-primary px-8 py-2.5 font-bold">
                                <i className="bi bi-check-lg ml-2" />
                                {editingCrop ? 'تحديث المحصول' : 'حفظ المحصول'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Crops Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-list-ul text-lime-500" />
                        قائمة المحاصيل
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(132,204,22,0.15)', color: 'rgb(101,163,13)' }}>
                            {filteredCrops.length}
                        </span>
                    </h5>
                </div>
                <div>
                    {filteredCrops.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-flower1 text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا توجد محاصيل</h4>
                            <p className="text-sm mb-6" style={{ color: 'var(--lg-text-muted)' }}>قم بإضافة المحاصيل التي تتاجر بها</p>
                            <button onClick={() => setShowAddForm(true)} className="lg-btn lg-btn-primary px-5 py-2.5 font-medium">
                                <i className="bi bi-plus-lg ml-2" />
                                إضافة أول محصول
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-right">#</th>
                                        <th className="px-6 py-4 font-bold text-right">اسم المحصول</th>
                                        <th className="px-6 py-4 font-bold text-right">وحدات التسعير</th>
                                        <th className="px-6 py-4 font-bold text-right">عوامل التحويل</th>
                                        <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredCrops.map((crop, idx) => (
                                        <tr key={crop.crop_id} className="transition-all lg-animate-in" style={{ animationDelay: `${Math.min(idx, 7) * 50}ms` }}>
                                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--lg-text-primary)' }}>{crop.crop_id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--lg-glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--lg-glass-border)', color: 'var(--lg-primary)' }}>
                                                        <i className="bi bi-flower1" />
                                                    </div>
                                                    <span className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>{crop.crop_name}</span>
                                                    {crop.is_complex_unit && (
                                                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                            <i className="bi bi-gear-fill" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 flex-wrap">
                                                    {crop.allowed_pricing_units.map((unit, i) => (
                                                        <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">{unit}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {Object.entries(crop.conversion_factors).map(([unit, factor], i) => (
                                                        <div key={i} className="flex items-center gap-1">
                                                            <i className="bi bi-arrow-return-right text-gray-300 dark:text-gray-600" />
                                                            <span className="font-medium text-gray-600 dark:text-gray-300">{unit}:</span> {factor} كجم
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 justify-end">
                                                    <button onClick={() => handleEdit(crop)} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="تعديل">
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(crop)} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="حذف">
                                                        <i className="bi bi-trash" />
                                                    </button>
                                                </div>
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

export default CropManagement;
