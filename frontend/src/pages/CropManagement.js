import React, { useState, useEffect } from 'react';
import { getCrops, createCrop, updateCrop, deleteCrop } from '../api/crops';

function CropManagement() {
    const [crops, setCrops] = useState([]);
    const [cropName, setCropName] = useState('');
    const [conversionFactors, setConversionFactors] = useState([{ unit: '', factor: '' }]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [cropToDelete, setCropToDelete] = useState(null);

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
                conversion_factors: factorsObject
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

        const factorsArray = Object.entries(crop.conversion_factors).map(([unit, factor]) => ({
            unit,
            factor: factor.toString()
        }));
        setConversionFactors(factorsArray.length > 0 ? factorsArray : [{ unit: '', factor: '' }]);
        setShowAddForm(true);
    };

    const handleDeleteClick = (crop) => {
        setCropToDelete(crop);
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
            setError(error.response?.data?.detail || "فشل حذف المحصول. قد يكون مرتبط بعمليات بيع أو شراء.");
            setShowDeleteModal(false);
            setCropToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setCropToDelete(null);
    };

    const resetForm = () => {
        setCropName('');
        setConversionFactors([{ unit: '', factor: '' }]);
        setShowAddForm(false);
        setEditingCrop(null);
    };

    const filteredCrops = crops.filter(crop =>
        crop.crop_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    تأكيد الحذف
                                </h5>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3">
                                    هل أنت متأكد من حذف المحصول <strong>"{cropToDelete?.crop_name}"</strong>؟
                                </p>
                                <div className="alert alert-warning d-flex align-items-start">
                                    <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                                    <div>
                                        <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.
                                        <br />
                                        <small>لن تتمكن من حذف المحصول إذا كان مرتبطاً بعمليات بيع أو شراء.</small>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cancelDelete}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    حذف نهائياً
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-flower1 me-2"></i>
                        إدارة المحاصيل
                    </h2>
                    <p className="text-muted">إدارة أنواع المحاصيل ووحدات القياس</p>
                </div>
            </div>

            {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>}

            {/* Action Bar */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 search-box"
                            placeholder="بحث عن محصول..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-start">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                            if (showAddForm) {
                                resetForm();
                            } else {
                                setShowAddForm(true);
                            }
                        }}
                    >
                        <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                        {showAddForm ? 'إلغاء' : 'إضافة محصول جديد'}
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="card border-0 shadow-sm mb-4 fade-in">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className={`bi ${editingCrop ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                            {editingCrop ? 'تعديل محصول' : 'محصول جديد'}
                        </h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="cropName" className="form-label fw-bold">اسم المحصول</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    id="cropName"
                                    value={cropName}
                                    onChange={(e) => setCropName(e.target.value)}
                                    placeholder="مثال: قمح، ذرة، أرز..."
                                    required
                                />
                            </div>

                            <hr />

                            <h5 className="mb-3">
                                <i className="bi bi-calculator me-2"></i>
                                عوامل التحويل (بالنسبة للكيلوجرام)
                            </h5>
                            <p className="text-muted small mb-3">حدد الوحدات المستخدمة في البيع والشراء وكم كيلو تساوي كل وحدة</p>

                            {conversionFactors.map((factor, index) => (
                                <div className="row align-items-center mb-3" key={index}>
                                    <div className="col-md-5">
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="unit"
                                            placeholder="اسم الوحدة (مثال: شكارة، طن)"
                                            value={factor.unit}
                                            onChange={event => handleFactorChange(index, event)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-5">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="factor"
                                            placeholder="تساوي كم كيلو؟ (مثال: 50)"
                                            value={factor.factor}
                                            onChange={event => handleFactorChange(index, event)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        {conversionFactors.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm w-100"
                                                onClick={() => handleRemoveFactor(index)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                className="btn btn-outline-secondary mb-3"
                                onClick={handleAddFactor}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                إضافة وحدة أخرى
                            </button>

                            <div className="mt-4 d-flex gap-2">
                                <button type="submit" className="btn btn-success btn-lg">
                                    <i className="bi bi-check-lg me-2"></i>
                                    {editingCrop ? 'تحديث المحصول' : 'حفظ المحصول'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-lg"
                                    onClick={resetForm}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Crops Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        قائمة المحاصيل ({filteredCrops.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredCrops.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <p className="text-muted">لا توجد محاصيل مسجلة</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddForm(true)}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                إضافة أول محصول
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>اسم المحصول</th>
                                        <th>وحدات التسعير</th>
                                        <th>عوامل التحويل</th>
                                        <th style={{ width: '150px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCrops.map(crop => (
                                        <tr key={crop.crop_id}>
                                            <td className="fw-bold">{crop.crop_id}</td>
                                            <td>
                                                <i className="bi bi-flower1 me-2 text-success"></i>
                                                {crop.crop_name}
                                            </td>
                                            <td>
                                                {crop.allowed_pricing_units.map((unit, idx) => (
                                                    <span key={idx} className="badge bg-secondary me-1">
                                                        {unit}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {Object.entries(crop.conversion_factors).map(([unit, factor], idx) => (
                                                        <div key={idx}>
                                                            {unit}: {factor} كجم
                                                        </div>
                                                    ))}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(crop)}
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
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
        </div>
    );
}

export default CropManagement;
