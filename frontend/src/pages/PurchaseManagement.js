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
    const [selectedCropFilter, setSelectedCropFilter] = useState(null); // null = all, or crop_id

    // State for the payment modal
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingPurchase, setPayingPurchase] = useState(null);

    // State for flexible units
    const [currentCrop, setCurrentCrop] = useState(null);

    const [formState, setFormState] = useState({
        crop_id: '',
        supplier_id: '',
        purchase_date: new Date().toISOString().slice(0, 10),
        quantity_input: '', // Quantity in selected unit
        price_input: '',    // Price per selected unit
        purchasing_pricing_unit: 'kg',
        conversion_factor: 1.0,
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

        if (name === 'crop_id') {
            const selectedCrop = crops.find(c => c.crop_id.toString() === value);
            setCurrentCrop(selectedCrop);

            // Allow selecting units if crop has them, otherwise default to kg
            let defaultUnit = 'kg';
            let defaultFactor = 1.0;

            if (selectedCrop && selectedCrop.allowed_pricing_units && selectedCrop.allowed_pricing_units.length > 0) {
                defaultUnit = selectedCrop.allowed_pricing_units[0];
                defaultFactor = selectedCrop.conversion_factors[defaultUnit] || 1.0;
            }

            setFormState(prevState => ({
                ...prevState,
                [name]: value,
                purchasing_pricing_unit: defaultUnit,
                conversion_factor: defaultFactor
            }));
        } else if (name === 'purchasing_pricing_unit') {
            // Find conversion factor for selected unit
            const factor = currentCrop?.conversion_factors?.[value] || 1.0;
            setFormState(prevState => ({
                ...prevState,
                [name]: value,
                conversion_factor: factor
            }));
        } else {
            setFormState(prevState => ({
                ...prevState,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Calculate standardized values for backend
            const quantity_kg = parseFloat(formState.quantity_input) * parseFloat(formState.conversion_factor);
            // Unit price in DB is per KG. 
            // Input Price (per Unit) / Factor (kg per Unit) = Price per KG
            const unit_price_per_kg = parseFloat(formState.price_input) / parseFloat(formState.conversion_factor);

            const submissionData = {
                crop_id: parseInt(formState.crop_id),
                supplier_id: parseInt(formState.supplier_id),
                purchase_date: formState.purchase_date,
                quantity_kg: quantity_kg,
                unit_price: unit_price_per_kg,
                purchasing_pricing_unit: formState.purchasing_pricing_unit,
                conversion_factor: formState.conversion_factor,
                amount_paid: parseFloat(formState.amount_paid) || 0,
                notes: `Original: ${formState.quantity_input} ${formState.purchasing_pricing_unit} @ ${formState.price_input}/${formState.purchasing_pricing_unit}`
            };

            await createPurchase(submissionData);
            fetchPurchases();

            // Reset form
            setFormState({
                crop_id: '',
                supplier_id: '',
                purchase_date: new Date().toISOString().slice(0, 10),
                quantity_input: '',
                price_input: '',
                purchasing_pricing_unit: 'kg',
                conversion_factor: 1.0,
                amount_paid: ''
            });
            setCurrentCrop(null);
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

    // Get unique crops from purchases for filter tabs
    const uniqueCrops = React.useMemo(() => {
        const cropMap = new Map();
        purchases.forEach(purchase => {
            if (purchase.crop) {
                const existing = cropMap.get(purchase.crop.crop_id) || { count: 0, crop: purchase.crop };
                existing.count++;
                cropMap.set(purchase.crop.crop_id, existing);
            }
        });
        return Array.from(cropMap.values()).sort((a, b) => b.count - a.count);
    }, [purchases]);

    // Set default filter to most used crop on first load
    React.useEffect(() => {
        if (uniqueCrops.length > 0 && selectedCropFilter === null && purchases.length > 0) {
            setSelectedCropFilter(uniqueCrops[0].crop.crop_id);
        }
    }, [uniqueCrops, purchases.length]);

    // Filter purchases based on search term AND selected crop
    const filteredPurchases = purchases.filter(purchase => {
        const matchesSearch = (
            purchase.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.crop?.crop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.purchase_id?.toString().includes(searchTerm)
        );
        const matchesCrop = selectedCropFilter === 'all' || selectedCropFilter === null
            ? true
            : purchase.crop?.crop_id === selectedCropFilter;
        return matchesSearch && matchesCrop;
    });

    // Calculate totals for summary/preview
    const calculatedTotal = (parseFloat(formState.quantity_input || 0) * parseFloat(formState.price_input || 0));
    const calculatedQtyKg = (parseFloat(formState.quantity_input || 0) * parseFloat(formState.conversion_factor || 1));

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

            {/* Crop Filter Tabs */}
            {!showAddForm && uniqueCrops.length > 0 && (
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <span className="text-muted me-2"><i className="bi bi-funnel me-1"></i>فلترة:</span>
                            <button
                                className={`btn btn-sm ${selectedCropFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setSelectedCropFilter('all')}
                            >
                                الكل ({purchases.length})
                            </button>
                            {uniqueCrops.map(({ crop, count }) => (
                                <button
                                    key={crop.crop_id}
                                    className={`btn btn-sm ${selectedCropFilter === crop.crop_id ? 'btn-success' : 'btn-outline-success'}`}
                                    onClick={() => setSelectedCropFilter(crop.crop_id)}
                                >
                                    <i className="bi bi-flower1 me-1"></i>
                                    {crop.crop_name} ({count})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
                                    <label className="form-label fw-bold">وحدة التسعير</label>
                                    <select
                                        className="form-select"
                                        name="purchasing_pricing_unit"
                                        value={formState.purchasing_pricing_unit}
                                        onChange={handleInputChange}
                                        disabled={!currentCrop}
                                    >
                                        <option value="kg">كيلوجرام (kg)</option>
                                        {currentCrop?.allowed_pricing_units?.map((unit, idx) => (
                                            <option key={idx} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    {/* Spacer or Factor Display */}
                                    <label className="form-label text-muted">عامل التحويل</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={`${formState.conversion_factor} كجم / ${formState.purchasing_pricing_unit}`}
                                        disabled
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">الكمية ({formState.purchasing_pricing_unit})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="quantity_input"
                                        value={formState.quantity_input}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">السعر ({formState.purchasing_pricing_unit})</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="price_input"
                                        value={formState.price_input}
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
                                        <i className="bi bi-calculator me-2 fs-5"></i>
                                        <div>
                                            <strong>تفاصيل العملية:</strong><br />
                                            الكمية بالمخزن: {calculatedQtyKg.toFixed(2)} كجم<br />
                                            التكلفة الإجمالية: {calculatedTotal.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
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
                                <thead className="table-light">
                                    <tr>
                                        <th>المحصول</th>
                                        <th>المورد</th>
                                        <th className="text-center">الكمية</th>
                                        <th className="text-center">السعر</th>
                                        <th className="text-center">الإجمالي</th>
                                        <th>التاريخ</th>
                                        <th className="text-center">الحالة</th>
                                        <th style={{ width: '130px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPurchases.map(p => {
                                        const originalUnit = p.purchasing_pricing_unit || 'kg';
                                        const factor = p.conversion_factor || 1.0;
                                        const originalQty = (p.quantity_kg || 0) / factor;
                                        const originalPrice = (p.unit_price || 0) * factor;

                                        return (
                                            <tr key={p.purchase_id}>
                                                <td>
                                                    <span className="badge bg-info-subtle text-info">
                                                        <i className="bi bi-flower1 me-1"></i>
                                                        {p.crop?.crop_name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <i className="bi bi-truck me-1 text-primary"></i>
                                                    {p.supplier?.name || 'N/A'}
                                                </td>
                                                <td className="text-center">
                                                    <strong>{originalQty.toFixed(0)}</strong>
                                                    <small className="text-muted ms-1">{originalUnit}</small>
                                                </td>
                                                <td className="text-center">
                                                    {originalPrice.toLocaleString('ar-EG')}
                                                    <small className="text-muted">/{originalUnit}</small>
                                                </td>
                                                <td className="text-center fw-bold text-danger">
                                                    {(p.total_cost ?? 0).toLocaleString('ar-EG')} ج.م
                                                </td>
                                                <td>
                                                    <small>{new Date(p.purchase_date).toLocaleDateString('ar-EG')}</small>
                                                </td>
                                                <td className="text-center">{getStatusBadge(p.payment_status)}</td>
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
                                        )
                                    })}
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
