import React, { useState, useEffect } from 'react';
import { getCrops, createCrop, updateCrop, deleteCrop, migrateAndDeleteCrop, forceDeleteCrop } from '../api/crops';

function CropManagement() {
    const [crops, setCrops] = useState([]);
    const [cropName, setCropName] = useState('');
    const [conversionFactors, setConversionFactors] = useState([{ unit: '', factor: '' }]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Deletion & Conflict Handling States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [cropToDelete, setCropToDelete] = useState(null);
    const [conflictData, setConflictData] = useState(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [migrationTarget, setMigrationTarget] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // New Fields for Complex Crops
    const [isComplex, setIsComplex] = useState(false);
    const [defaultTare, setDefaultTare] = useState(0);
    const [standardWeight, setStandardWeight] = useState(0);

    useEffect(() => {
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        try {
            const data = await getCrops();
            setCrops(data);
        } catch (error) {
            console.error("Failed to fetch crops:", error);
            setError("فشل تحميل المحاصيل");
        }
    };

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
            } else {
                await createCrop(cropData);
            }

            fetchCrops();
            resetForm();
            setError(null);
        } catch (error) {
            console.error("Failed to save crop:", error);
            setError(error.response?.data?.detail || "فشل حفظ المحصول");
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
            setError(null);
            setShowDeleteModal(false);
            setCropToDelete(null);
        } catch (error) {
            console.error("Failed to delete crop:", error);
            if (error.response && error.response.status === 409) {
                // Conflict detected!
                setConflictData(error.response.data.conflicts);
                setShowDeleteModal(false); // Close simple confirmation
                setShowConflictModal(true); // Open conflict resolution
            } else {
                setError(error.response?.data?.detail || "فشل حذف المحصول.");
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
        } catch (error) {
            console.error("Migration failed:", error);
            setError(error.response?.data?.detail || "فشل نقل البيانات وحذف المحصول");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleForceDelete = async () => {
        if (!cropToDelete) return;

        if (!window.confirm("تحذير أخير: سيتم حذف جميع المبيعات والمشتريات والمخزون المرتبط بهذا المحصول نهائياً. هل أنت متأكد تماماً؟")) {
            return;
        }

        setIsProcessing(true);
        try {
            await forceDeleteCrop(cropToDelete.crop_id);
            await fetchCrops();
            setShowConflictModal(false);
            setCropToDelete(null);
            setConflictData(null);
        } catch (error) {
            console.error("Force delete failed:", error);
            setError(error.response?.data?.detail || "فشل الحذف الإجباري");
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
        setIsProcessing(false);
    };

    const filteredCrops = crops.filter(crop =>
        crop.crop_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter available targets for migration (exclude current crop)
    const availableTargets = crops.filter(c => cropToDelete && c.crop_id !== cropToDelete.crop_id);

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* 1. Simple Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={cancelDelete}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 sm:px-6 flex items-center border-b border-red-100 dark:border-red-900/30">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <i className="bi bi-exclamation-triangle text-red-600 dark:text-red-400"></i>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                                    <h3 className="text-lg leading-6 font-medium text-red-800 dark:text-red-400" id="modal-title">تأكيد الحذف</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    هل أنت متأكد من حذف المحصول <span className="font-bold text-gray-800 dark:text-gray-200">"{cropToDelete?.crop_name}"</span>؟
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={confirmDelete}
                                >
                                    حذف
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={cancelDelete}
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Conflict Resolution Modal */}
            {showConflictModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={cancelDelete}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 sm:px-6 flex items-center border-b border-amber-100 dark:border-amber-900/30">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <i className="bi bi-diagram-3-fill text-amber-600 dark:text-amber-400"></i>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:mr-4 sm:text-right">
                                    <h3 className="text-lg leading-6 font-medium text-amber-800 dark:text-amber-400" id="modal-title">لا يمكن الحذف المباشر</h3>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    المحصول <span className="font-bold text-gray-800 dark:text-gray-200">"{cropToDelete?.crop_name}"</span> مرتبط بالسجلات التالية ولا يمكن حذفه مباشرة:
                                </p>

                                {conflictData && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                        {Object.entries(conflictData).map(([key, count]) => (
                                            count > 0 && (
                                                <div key={key} className="bg-gray-50 dark:bg-slate-700 p-2 rounded border border-gray-200 dark:border-slate-600 flex justify-between items-center px-3">
                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{key.replace('_', ' ')}</span>
                                                    <span className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {/* Option 1 */}
                                    <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg overflow-hidden">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b border-blue-200 dark:border-blue-900/30 font-bold text-blue-800 dark:text-blue-400 text-sm flex items-center gap-2">
                                            <i className="bi bi-arrow-left-right"></i>
                                            الخيار 1: نقل البيانات (موصى به)
                                        </div>
                                        <div className="p-4">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                اختر محصولاً آخر لنقل جميع المشتريات والمبيعات والمخزون إليه، ثم سيتم حذف هذا المحصول.
                                            </p>
                                            <div className="flex gap-2">
                                                <select
                                                    className="block w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                                    value={migrationTarget}
                                                    onChange={(e) => setMigrationTarget(e.target.value)}
                                                >
                                                    <option value="">-- اختر المحصول البديل --</option>
                                                    {availableTargets.map(c => (
                                                        <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors shadow-sm whitespace-nowrap ${!migrationTarget || isProcessing ? 'bg-blue-300 dark:bg-blue-900/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    onClick={handleMigrate}
                                                    disabled={!migrationTarget || isProcessing}
                                                >
                                                    {isProcessing ? 'جاري...' : 'نقل وحذف'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Option 2 */}
                                    <div className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden">
                                        <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 border-b border-red-200 dark:border-red-900/30 font-bold text-red-800 dark:text-red-400 text-sm flex items-center gap-2">
                                            <i className="bi bi-trash-fill"></i>
                                            الخيار 2: الحذف القسري (خطر)
                                        </div>
                                        <div className="p-4">
                                            <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                                                سيتم حذف المحصول وجميع السجلات المرتبطة به نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                            </p>
                                            <button
                                                className={`w-full px-4 py-2 rounded-lg text-sm font-bold border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm flex items-center justify-center gap-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={handleForceDelete}
                                                disabled={isProcessing}
                                            >
                                                <i className="bi bi-exclamation-octagon"></i>
                                                {isProcessing ? 'جاري الحذف...' : 'حذف المحصول وجميع بياناته'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={cancelDelete}
                                    disabled={isProcessing}
                                >
                                    إلغاء الأمر
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                                <i className="bi bi-flower1"></i>
                            </span>
                            إدارة المحاصيل
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 ms-12">إدارة أنواع المحاصيل ووحدات القياس</p>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 p-4 mb-6 rounded shadow-sm flex items-center animate-fade-in">
                    <i className="bi bi-exclamation-triangle-fill text-red-500 text-xl me-3"></i>
                    <div className="flex-1">
                        <p className="text-red-800 dark:text-red-300 font-medium m-0">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 gap-4 font-sans text-right">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                        <i className="bi bi-search text-gray-400"></i>
                    </div>
                    <input
                        type="text"
                        className="block w-full text-sm rounded-lg border-gray-300 dark:border-slate-600 ps-10 p-2.5 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-slate-700 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                        placeholder="بحث عن محصول..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className={`nav-link px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2 ${showAddForm ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50' : 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent'}`}
                    onClick={() => {
                        if (showAddForm) {
                            resetForm();
                        } else {
                            setShowAddForm(true);
                        }
                    }}
                >
                    <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
                    {showAddForm ? 'إلغاء' : 'إضافة محصول جديد'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-6 animate-slide-down">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <div className={`p-2 rounded-lg ${editingCrop ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                            <i className={`bi ${editingCrop ? 'bi-pencil-square' : 'bi-plus-circle'} text-xl`}></i>
                        </div>
                        <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0 text-right w-full">
                            {editingCrop ? 'تعديل بيانات المحصول' : 'تسجيل محصول جديد'}
                        </h5>
                    </div>

                    <form onSubmit={handleSubmit} className="text-right">
                        <div className="mb-6">
                            <label htmlFor="cropName" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">اسم المحصول</label>
                            <input
                                type="text"
                                className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-lg rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 font-bold"
                                id="cropName"
                                value={cropName}
                                onChange={(e) => setCropName(e.target.value)}
                                placeholder="مثال: قمح، ذرة، أرز..."
                                required
                            />
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-200 dark:border-slate-600 mb-6">
                            <label className="inline-flex items-center cursor-pointer mb-2">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isComplex}
                                    onChange={(e) => setIsComplex(e.target.checked)}
                                />
                                <div className="relative w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                <span className="ms-3 text-sm font-bold text-gray-900 dark:text-gray-100">محصول مركب (حسابات خاصة)</span>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 ms-14 mb-0">
                                فعّل هذا الخيار للمحاصيل التي تتطلب خصم عيار (فارغ) وحساب صافي الوزن، مثل القطن.
                            </p>

                            {isComplex && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fade-in">
                                    <div>
                                        <label htmlFor="defaultTare" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">العيار الافتراضي للشكارة/الوحدة (كجم)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                            id="defaultTare"
                                            value={defaultTare}
                                            onChange={(e) => setDefaultTare(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="standardWeight" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">وزن الوحدة القياسي (إن وجد)</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                            id="standardWeight"
                                            value={standardWeight}
                                            onChange={(e) => setStandardWeight(e.target.value)}
                                            placeholder="مثال: 157.5 للقنطار"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <h5 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                                <i className="bi bi-calculator me-2 text-emerald-600 dark:text-emerald-400"></i>
                                عوامل التحويل (بالنسبة للكيلوجرام)
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">حدد الوحدات المستخدمة في البيع والشراء وكم كيلو تساوي كل وحدة.</p>

                            {conversionFactors.map((factor, index) => (
                                <div className="flex flex-col md:flex-row gap-3 mb-3 items-end" key={index}>
                                    <div className="flex-1">
                                        <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">اسم الوحدة</label>
                                        <input
                                            type="text"
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                            name="unit"
                                            placeholder="مثال: شكارة، طن"
                                            value={factor.unit}
                                            onChange={event => handleFactorChange(index, event)}
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-400">الوزن بالكيلو</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5"
                                            name="factor"
                                            placeholder="مثال: 50"
                                            value={factor.factor}
                                            onChange={event => handleFactorChange(index, event)}
                                            required
                                        />
                                    </div>
                                    <div className="w-10">
                                        {conversionFactors.length > 1 && (
                                            <button
                                                type="button"
                                                className="w-full h-[42px] flex items-center justify-center text-red-500 dark:text-red-400 hover:text-white border border-red-500 hover:bg-red-600 dark:hover:bg-red-900/50 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm transition-colors"
                                                onClick={() => handleRemoveFactor(index)}
                                                title="حذف الوحدة"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                                onClick={handleAddFactor}
                            >
                                <i className="bi bi-plus-circle"></i>
                                إضافة وحدة أخرى
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors shadow-sm"
                                onClick={resetForm}
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm transition-colors flex items-center"
                            >
                                <i className="bi bi-check-lg me-2"></i>
                                {editingCrop ? 'تحديث المحصول' : 'حفظ المحصول'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Crops Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 flex justify-between items-center transition-colors">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100 mb-0 flex items-center">
                        <i className="bi bi-list-ul me-2 text-emerald-600 dark:text-emerald-400"></i>
                        قائمة المحاصيل
                        <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full ms-2 border border-emerald-200 dark:border-emerald-800/50">
                            {filteredCrops.length}
                        </span>
                    </h5>
                </div>

                {filteredCrops.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-gray-50 dark:bg-slate-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                            <i className="bi bi-flower1 text-4xl text-gray-300 dark:text-gray-600"></i>
                        </div>
                        <h6 className="text-gray-500 dark:text-gray-400 font-medium mb-2">لا توجد محاصيل مسجلة</h6>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">قم بإضافة المحاصيل التي تتاجر بها للبدء</p>
                        <button
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            onClick={() => setShowAddForm(true)}
                        >
                            <i className="bi bi-plus-lg me-2"></i>
                            إضافة أول محصول
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto text-right">
                        <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-700 transition-colors">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-bold text-right"># ID</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-right">اسم المحصول</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-right">وحدات التسعير</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-right">عوامل التحويل</th>
                                    <th scope="col" className="px-6 py-3 font-bold text-end">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {filteredCrops.map(crop => (
                                    <tr key={crop.crop_id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700 text-right">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                            {crop.crop_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 me-3 font-bold text-xs shrink-0 transition-colors">
                                                    <i className="bi bi-flower1"></i>
                                                </div>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{crop.crop_name}</span>
                                                {crop.is_complex_unit && (
                                                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-medium px-2 py-0.5 rounded ms-2 border border-amber-200 dark:border-amber-800/50" title="محصول مركب">
                                                        <i className="bi bi-gear-fill"></i>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {crop.allowed_pricing_units.map((unit, idx) => (
                                                    <span key={idx} className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-200 dark:border-slate-600 transition-colors">
                                                        {unit}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                {Object.entries(crop.conversion_factors).map(([unit, factor], idx) => (
                                                    <div key={idx} className="flex items-center gap-1">
                                                        <i className="bi bi-arrow-return-right text-gray-300 dark:text-gray-600"></i>
                                                        <span className="font-medium text-gray-600 dark:text-gray-300">{unit}:</span> {factor} كجم
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex justify-end gap-2 text-right">
                                                <button
                                                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                                    onClick={() => handleEdit(crop)}
                                                    title="تعديل"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    onClick={() => handleDeleteClick(crop)}
                                                    title="حذف"
                                                >
                                                    <i className="bi bi-trash"></i>
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
    );
}

export default CropManagement;
