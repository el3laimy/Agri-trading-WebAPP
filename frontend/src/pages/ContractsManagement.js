import React, { useState, useEffect } from 'react';
import { getContracts, createContract, updateContractStatus } from '../api/contracts';
import { useData } from '../context/DataContext';

function ContractsManagement() {
    const { crops, suppliers } = useData();
    const [contracts, setContracts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [filters, setFilters] = useState({
        supplier_id: '',
        status: ''
    });

    const [formData, setFormData] = useState({
        supplier_id: '',
        crop_id: '',
        contract_date: new Date().toISOString().slice(0, 10),
        delivery_date: '', // Must be >= contract_date
        quantity_kg: '',
        price_per_kg: '',
        notes: ''
    });

    useEffect(() => {
        loadContracts();
    }, [filters]);

    const loadContracts = async () => {
        try {
            const data = await getContracts(filters);
            setContracts(data);
        } catch (err) {
            setError('Failed to load contracts.');
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createContract({
                ...formData,
                supplier_id: parseInt(formData.supplier_id),
                crop_id: parseInt(formData.crop_id),
                quantity_kg: parseFloat(formData.quantity_kg),
                price_per_kg: parseFloat(formData.price_per_kg),
            });
            setSuccessMsg('Contract created successfully!');
            setShowAddForm(false);
            setFormData({
                supplier_id: '',
                crop_id: '',
                contract_date: new Date().toISOString().slice(0, 10),
                delivery_date: '',
                quantity_kg: '',
                price_per_kg: '',
                notes: ''
            });
            loadContracts();
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError('Failed to create contract.');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleStatusUpdate = async (contractId, newStatus) => {
        try {
            await updateContractStatus(contractId, newStatus);
            loadContracts();
        } catch (err) {
            setError('Failed to update status.');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE': return <span className="badge bg-primary">نشط</span>;
            case 'COMPLETED': return <span className="badge bg-success">مكتمل</span>;
            case 'CANCELLED': return <span className="badge bg-danger">ملغي</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    return (
        <div className="container-fluid">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-file-earmark-text me-2"></i>
                        عقود التوريد
                    </h2>
                    <p className="text-muted">إدارة عقود التوريد مع الموردين</p>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            {/* Filters & Actions */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label">تصفية بالمورد</label>
                            <select
                                className="form-select"
                                name="supplier_id"
                                value={filters.supplier_id}
                                onChange={handleFilterChange}
                            >
                                <option value="">الكل</option>
                                {suppliers.map(s => (
                                    <option key={s.contact_id} value={s.contact_id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">الحالة</label>
                            <select
                                className="form-select"
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="">الكل</option>
                                <option value="ACTIVE">نشط</option>
                                <option value="COMPLETED">مكتمل</option>
                                <option value="CANCELLED">ملغي</option>
                            </select>
                        </div>
                        <div className="col-md-4 text-start">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddForm(!showAddForm)}
                            >
                                <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                                {showAddForm ? 'إلغاء' : 'عقد جديد'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contract Form */}
            {showAddForm && (
                <div className="card border-0 shadow-sm mb-4 fade-in">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">إنشاء عقد جديد</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">المورد</label>
                                    <select
                                        className="form-select"
                                        name="supplier_id"
                                        value={formData.supplier_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">اختر المورد</option>
                                        {suppliers.map(s => (
                                            <option key={s.contact_id} value={s.contact_id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">المحصول</label>
                                    <select
                                        className="form-select"
                                        name="crop_id"
                                        value={formData.crop_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">اختر المحصول</option>
                                        {crops.map(c => (
                                            <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">تاريخ العقد</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="contract_date"
                                        value={formData.contract_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">تاريخ التوريد المتوقع</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="delivery_date"
                                        value={formData.delivery_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">الكمية المتفق عليها (كجم)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="quantity_kg"
                                        value={formData.quantity_kg}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">السعر المتفق عليه (ج.م/كجم)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="price_per_kg"
                                        value={formData.price_per_kg}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">ملاحظات / شروط إضافية</label>
                                    <textarea
                                        className="form-control"
                                        name="notes"
                                        rows="3"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                    ></textarea>
                                </div>
                                <div className="col-12 mt-3 text-start">
                                    <button type="submit" className="btn btn-success btn-lg">
                                        <i className="bi bi-save me-2"></i>
                                        حفظ العقد
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contracts List */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        قائمة العقود ({contracts.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {contracts.length === 0 ? (
                        <div className="text-center py-5 text-muted">لا توجد عقود مسجلة</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>المورد</th>
                                        <th>المحصول</th>
                                        <th>تاريخ التسليم</th>
                                        <th>الكمية (كجم)</th>
                                        <th>السعر/كجم</th>
                                        <th>الإجمالي</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contracts.map(contract => (
                                        <tr key={contract.contract_id}>
                                            <td className="fw-bold">{contract.contract_id}</td>
                                            <td>{contract.supplier?.name}</td>
                                            <td>{contract.crop?.crop_name}</td>
                                            <td>{new Date(contract.delivery_date).toLocaleDateString('ar-EG')}</td>
                                            <td>{contract.quantity_kg.toLocaleString()}</td>
                                            <td>{contract.price_per_kg.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                                            <td className="fw-bold fs-6">{(contract.total_amount).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</td>
                                            <td>{getStatusBadge(contract.status)}</td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    {contract.status === 'ACTIVE' && (
                                                        <>
                                                            <button
                                                                className="btn btn-success"
                                                                title="إتمام العقد"
                                                                onClick={() => handleStatusUpdate(contract.contract_id, 'COMPLETED')}
                                                            >
                                                                <i className="bi bi-check-lg"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                title="إلغاء العقد"
                                                                onClick={() => handleStatusUpdate(contract.contract_id, 'CANCELLED')}
                                                            >
                                                                <i className="bi bi-x-lg"></i>
                                                            </button>
                                                        </>
                                                    )}
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

export default ContractsManagement;
