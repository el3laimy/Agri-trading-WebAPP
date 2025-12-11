import React, { useState, useEffect } from 'react';
import { getPurchases, createPurchase } from '../api/purchases';
import { useData } from '../context/DataContext';
import PaymentForm from '../components/PaymentForm';

function PurchaseManagement() {
    const { crops, suppliers } = useData();
    const [purchases, setPurchases] = useState([]);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the payment modal
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingPurchase, setPayingPurchase] = useState(null);

    const [formState, setFormState] = useState({
        crop_id: '',
        supplier_id: '',
        purchase_date: new Date().toISOString().slice(0, 10),
        quantity_kg: '',
        unit_price: '',
        amount_paid: ''
    });

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            const purchasesData = await getPurchases();
            setPurchases(purchasesData);
        } catch (error) {
            console.error("Failed to fetch purchases:", error);
            setError("Failed to load purchases.");
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormState(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submissionData = {
                ...formState,
                crop_id: parseInt(formState.crop_id),
                supplier_id: parseInt(formState.supplier_id),
                quantity_kg: parseFloat(formState.quantity_kg),
                quantity_kg: parseFloat(formState.quantity_kg),
                unit_price: parseFloat(formState.unit_price),
                amount_paid: parseFloat(formState.amount_paid) || 0
            };
            await createPurchase(submissionData);
            fetchPurchases();
            setFormState({ crop_id: '', supplier_id: '', purchase_date: new Date().toISOString().slice(0, 10), quantity_kg: '', unit_price: '', amount_paid: '' });
            setShowAddForm(false);
            setError(null);
        } catch (error) {
            console.error("Failed to create purchase:", error);
            setError("Failed to create purchase.");
        }
    };

    const handleRecordPayment = (purchase) => {
        setPayingPurchase(purchase);
        setShowPaymentForm(true);
    };

    const handleCancelPayment = () => {
        setShowPaymentForm(false);
        setPayingPurchase(null);
    };

    const handleSavePayment = async (paymentData) => {
        try {
            const response = await fetch('http://localhost:8000/api/v1/payments/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });
            if (!response.ok) {
                throw new Error('Failed to save payment.');
            }
            handleCancelPayment();
            fetchPurchases();
        } catch (error) {
            console.error("Payment error:", error);
            setError(error.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID': return <span className="badge bg-success">مدفوع</span>;
            case 'PARTIAL': return <span className="badge bg-warning text-dark">جزئي</span>;
            case 'PENDING':
            default: return <span className="badge bg-danger">معلق</span>;
        }
    };

    // Filter purchases based on search term
    const filteredPurchases = purchases.filter(purchase =>
        purchase.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.crop?.crop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.purchase_id?.toString().includes(searchTerm)
    );

    return (
        <div className="container-fluid">
            {showPaymentForm && payingPurchase &&
                <PaymentForm
                    purchase={payingPurchase}
                    onSave={handleSavePayment}
                    onCancel={handleCancelPayment}
                />
            }

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-bag-check me-2"></i>
                        إدارة المشتريات
                    </h2>
                    <p className="text-muted">إدارة وتتبع جميع عمليات الشراء</p>
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
                            placeholder="بحث بالمورد، المحصول أو رقم العملية..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-start">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                        {showAddForm ? 'إلغاء' : 'إضافة عملية شراء جديدة'}
                    </button>
                </div>
            </div>

            {/* Add Purchase Form */}
            {showAddForm && (
                <div className="card border-0 shadow-sm mb-4 fade-in">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-plus-circle me-2"></i>
                            عملية شراء جديدة
                        </h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">المحصول</label>
                                    <select
                                        className="form-select"
                                        name="crop_id"
                                        value={formState.crop_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">اختر المحصول</option>
                                        {crops.map(crop => (
                                            <option key={crop.crop_id} value={crop.crop_id}>
                                                {crop.crop_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">المورد</label>
                                    <select
                                        className="form-select"
                                        name="supplier_id"
                                        value={formState.supplier_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">اختر المورد</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier.contact_id} value={supplier.contact_id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">تاريخ الشراء</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="purchase_date"
                                        value={formState.purchase_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">الكمية (كجم)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="quantity_kg"
                                        value={formState.quantity_kg}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">سعر الوحدة (ج.م)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="unit_price"
                                        value={formState.unit_price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">المبلغ المدفوع (ج.م)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="amount_paid"
                                        value={formState.amount_paid}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                    />
                                    <div className="form-text">اتركه فارغاً للشراء الآجل بالكامل</div>
                                </div>
                                <div className="col-12">
                                    <div className="alert alert-info d-flex align-items-center">
                                        <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                                        <div>
                                            <strong>التكلفة الإجمالية المتوقعة:</strong> {' '}
                                            {(parseFloat(formState.quantity_kg || 0) * parseFloat(formState.unit_price || 0)).toFixed(2)} ج.م
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 d-flex gap-2">
                                <button type="submit" className="btn btn-success btn-lg">
                                    <i className="bi bi-check-lg me-2"></i>
                                    حفظ العملية
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-lg"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Purchases Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        سجل المشتريات ({filteredPurchases.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredPurchases.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <p className="text-muted">لا توجد عمليات شراء مسجلة</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddForm(true)}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                إضافة أول عملية شراء
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>التاريخ</th>
                                        <th>المورد</th>
                                        <th>المحصول</th>
                                        <th>الكمية</th>
                                        <th>التكلفة الإجمالية</th>
                                        <th>المدفوع</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPurchases.map(p => (
                                        <tr key={p.purchase_id}>
                                            <td className="fw-bold">{p.purchase_id}</td>
                                            <td>{new Date(p.purchase_date).toLocaleDateString('ar-EG')}</td>
                                            <td>{p.supplier?.name || 'N/A'}</td>
                                            <td>{p.crop?.crop_name || 'N/A'}</td>
                                            <td>{(p.quantity_kg || 0).toFixed(2)} كجم</td>
                                            <td className="fw-bold text-danger">
                                                {(p.total_cost ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                                            </td>
                                            <td>{(p.amount_paid ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</td>
                                            <td>{getStatusBadge(p.payment_status)}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => handleRecordPayment(p)}
                                                    disabled={p.payment_status === 'PAID'}
                                                >
                                                    <i className="bi bi-cash me-1"></i>
                                                    تسجيل دفعة
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

export default PurchaseManagement;
