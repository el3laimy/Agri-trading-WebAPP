import React, { useState, useEffect, useMemo } from 'react';
import { getCrops, createCrop, updateCrop, deleteCrop, migrateAndDeleteCrop, forceDeleteCrop } from '../api/crops';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

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

    // Complex Crops Fields
    const [isComplex, setIsComplex] = useState(false);
    const [defaultTare, setDefaultTare] = useState(0);
    const [standardWeight, setStandardWeight] = useState(0);

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
        const simple = crops.filter(c => !c.is_complex_unit).length;
        const complex = crops.filter(c => c.is_complex_unit).length;
        return { total: crops.length, simple, complex };
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
                    acc[curr.unit] = parseFloat(curr.factor);
                }
                return acc;
            }, {});

            const allowed_pricing_units = Object.keys(factorsObject);
            const cropData = {
                crop_name: cropName,
                allowed_pricing_units,
                conversion_factors: factorsObject,
                is_complex_unit: isComplex,
                default_tare_per_bag: parseFloat(defaultTare) || 0,
                standard_unit_weight: parseFloat(standardWeight) || null
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
            showError(error.response?.data?.detail || "فشل حفظ المحصول");
        }
    };

    const handleEdit = (crop) => {
        setEditingCrop(crop);
        setCropName(crop.crop_name);
        setIsComplex(crop.is_complex_unit || false);
        setDefaultTare(crop.default_tare_per_bag || 0);
        setStandardWeight(crop.standard_unit_weight || 0);

        const factorsArray = Object.entries(crop.conversion_factors).map(([unit, factor]) => ({
            unit,
            factor: factor.toString()
        }));
        setConversionFactors(factorsArray.length > 0 ? factorsArray : [{ unit: '', factor: '' }]);
        setShowAddForm(true);
    };

    const handleDeleteClick = (crop) => {
        setCropToDelete(crop);
        setConflictData(null);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!cropToDelete) return;
        try {
            await deleteCrop(cropToDelete.crop_id);
            fetchCrops();
            setShowDeleteModal(false);
            setCropToDelete(null);
            showSuccess('تم حذف المحصول بنجاح');
        } catch (error) {
            if (error.response?.status === 409) {
                setConflictData(error.response.data.conflicts);
                setShowDeleteModal(false);
                setShowConflictModal(true);
            } else {
                showError(error.response?.data?.detail || "فشل حذف المحصول");
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
            showError(error.response?.data?.detail || "فشل نقل البيانات");
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
            showError(error.response?.data?.detail || "فشل الحذف الإجباري");
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
        setIsComplex(false);
        setDefaultTare(0);
        setStandardWeight(0);
        setConversionFactors([{ unit: '', factor: '' }]);
        setShowAddForm(false);
        setEditingCrop(null);
    };

    // Filter crops
    const filteredCrops = useMemo(() => {
        return crops.filter(crop => {
            const matchesSearch = crop.crop_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter === 'all' ? true :
                selectedFilter === 'simple' ? !crop.is_complex_unit :
                    selectedFilter === 'complex' ? crop.is_complex_unit : true;
            return matchesSearch && matchesFilter;
        });
    }, [crops, searchTerm, selectedFilter]);

    const availableTargets = crops.filter(c => cropToDelete && c.crop_id !== cropToDelete.crop_id);

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-lime-200 to-green-200 dark:from-lime-800/30 dark:to-green-800/30" />
                </div>
                <div className="neumorphic p-6">
                    <LoadingCard rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete} />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-scale">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-bounce-in">
                                    <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">تأكيد الحذف</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    هل أنت متأكد من حذف <span className="font-bold text-gray-800 dark:text-gray-200">"{cropToDelete?.crop_name}"</span>؟
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button onClick={cancelDelete} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    إلغاء
                                </button>
                                <button onClick={confirmDelete} className="px-6 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 hover-scale">
                                    حذف
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Modal */}
            {showConflictModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete} />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in-scale">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <i className="bi bi-diagram-3-fill text-2xl text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">لا يمكن الحذف المباشر</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">المحصول مرتبط بسجلات أخرى</p>
                                </div>
                            </div>

                            {conflictData && (
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {Object.entries(conflictData).map(([key, count]) => (
                                        count > 0 && (
                                            <div key={key} className="neumorphic-inset p-3 rounded-xl flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{key.replace('_', ' ')}</span>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{count}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="neumorphic p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-bold">
                                        <i className="bi bi-arrow-left-right" />
                                        الخيار 1: نقل البيانات (موصى به)
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 p-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                            value={migrationTarget}
                                            onChange={(e) => setMigrationTarget(e.target.value)}
                                        >
                                            <option value="">-- اختر المحصول البديل --</option>
                                            {availableTargets.map(c => (
                                                <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>
                                            ))}
                                        </select>
                                        <button
                                            className={`px-4 py-2.5 rounded-xl font-bold text-white ${!migrationTarget || isProcessing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover-scale'}`}
                                            onClick={handleMigrate}
                                            disabled={!migrationTarget || isProcessing}
                                        >
                                            {isProcessing ? 'جاري...' : 'نقل وحذف'}
                                        </button>
                                    </div>
                                </div>

                                <div className="neumorphic p-4 rounded-xl border-2 border-red-200 dark:border-red-800">
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

                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                                <button onClick={cancelDelete} disabled={isProcessing} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                                    إلغاء الأمر
                                </button>
                            </div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-flower1 text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي المحاصيل</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-check-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">بسيط</p>
                                <p className="text-lg font-bold">{stats.simple}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-gear text-lg text-amber-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">مركب</p>
                                <p className="text-lg font-bold">{stats.complex}</p>
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
                <FilterChip label="بسيط" count={stats.simple} icon="bi-check-circle" active={selectedFilter === 'simple'} onClick={() => setSelectedFilter('simple')} color="emerald" />
                <FilterChip label="مركب" count={stats.complex} icon="bi-gear" active={selectedFilter === 'complex'} onClick={() => setSelectedFilter('complex')} color="amber" />
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-6 neumorphic overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className={`bi ${editingCrop ? 'bi-pencil-square' : 'bi-plus-circle-fill'} ml-2 text-lime-600 dark:text-lime-400`} />
                            {editingCrop ? 'تعديل بيانات المحصول' : 'تسجيل محصول جديد'}
                        </h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">اسم المحصول *</label>
                            <input
                                type="text"
                                value={cropName}
                                onChange={(e) => setCropName(e.target.value)}
                                required
                                placeholder="مثال: قمح، ذرة، أرز..."
                                className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100 font-bold text-lg"
                            />
                        </div>

                        {/* Complex Toggle */}
                        <div className="neumorphic-inset p-4 rounded-xl mb-6">
                            <label className="inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isComplex} onChange={(e) => setIsComplex(e.target.checked)} />
                                <div className="relative w-11 h-6 bg-gray-200 dark:bg-slate-600 rounded-full peer peer-checked:bg-lime-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                <span className="mr-3 text-sm font-bold text-gray-900 dark:text-gray-100">محصول مركب (حسابات خاصة)</span>
                            </label>
                            {isComplex && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fade-in">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">العيار الافتراضي (كجم)</label>
                                        <input type="number" step="0.01" value={defaultTare} onChange={(e) => setDefaultTare(e.target.value)} className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">وزن الوحدة القياسي</label>
                                        <input type="number" step="0.01" value={standardWeight} onChange={(e) => setStandardWeight(e.target.value)} placeholder="مثال: 157.5" className="w-full p-3 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Conversion Factors */}
                        <div className="mb-6">
                            <h5 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                                <i className="bi bi-calculator ml-2 text-lime-600 dark:text-lime-400" />
                                عوامل التحويل (بالنسبة للكيلوجرام)
                            </h5>
                            {conversionFactors.map((factor, index) => (
                                <div className="flex gap-3 mb-3 items-end" key={index}>
                                    <div className="flex-1">
                                        <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">اسم الوحدة</label>
                                        <input type="text" name="unit" placeholder="شكارة، طن" value={factor.unit} onChange={event => handleFactorChange(index, event)} required className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">الوزن بالكيلو</label>
                                        <input type="number" step="0.01" name="factor" placeholder="50" value={factor.factor} onChange={event => handleFactorChange(index, event)} required className="w-full p-2.5 neumorphic-inset rounded-xl text-gray-900 dark:text-gray-100" />
                                    </div>
                                    {conversionFactors.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveFactor(index)} className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                                            <i className="bi bi-trash" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddFactor} className="text-lime-600 hover:text-lime-700 font-medium text-sm flex items-center gap-1 mt-2">
                                <i className="bi bi-plus-circle" /> إضافة وحدة أخرى
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300">إلغاء</button>
                            <button type="submit" className="px-8 py-2.5 rounded-xl bg-lime-600 text-white hover:bg-lime-700 font-bold hover-scale">
                                <i className="bi bi-check-lg ml-2" />
                                {editingCrop ? 'تحديث المحصول' : 'حفظ المحصول'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Crops Table */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-lime-500" />
                        قائمة المحاصيل
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400">
                            {filteredCrops.length}
                        </span>
                    </h5>
                </div>
                <div>
                    {filteredCrops.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-lime-100 to-green-100 dark:from-lime-900/30 dark:to-green-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-flower1 text-5xl text-lime-400 dark:text-lime-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد محاصيل</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">قم بإضافة المحاصيل التي تتاجر بها</p>
                            <button onClick={() => setShowAddForm(true)} className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium bg-lime-600 text-white hover:bg-lime-700 hover-scale">
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
                                        <tr key={crop.crop_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{crop.crop_id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-100 to-green-100 dark:from-lime-900/50 dark:to-green-900/50 flex items-center justify-center text-lime-600 dark:text-lime-400">
                                                        <i className="bi bi-flower1" />
                                                    </div>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{crop.crop_name}</span>
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
