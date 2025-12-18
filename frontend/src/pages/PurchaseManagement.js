import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPurchases, createPurchase } from '../api/purchases';
import { useData } from '../context/DataContext';
import PaymentForm from '../components/PaymentForm';
import { CropFilterTabs } from '../components/sales';
import { PurchaseForm, PurchasesTable } from '../components/purchases';

// Initial form state
const getInitialFormState = () => ({
    crop_id: '',
    supplier_id: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    quantity_input: '',
    price_input: '',
    purchasing_pricing_unit: 'kg',
    conversion_factor: 1.0,
    amount_paid: ''
});

function PurchaseManagement() {
    const { crops, suppliers } = useData();
    const [purchases, setPurchases] = useState([]);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCropFilter, setSelectedCropFilter] = useState(null);

    // Payment modal state
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingPurchase, setPayingPurchase] = useState(null);

    // Form state
    const [currentCrop, setCurrentCrop] = useState(null);
    const [formState, setFormState] = useState(getInitialFormState());

    // Fetch purchases
    const fetchPurchases = useCallback(async () => {
        try {
            const purchasesData = await getPurchases();
            setPurchases(purchasesData);
        } catch (err) {
            console.error("Failed to fetch purchases:", err);
            setError("Failed to load purchases.");
        }
    }, []);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    // Input handler
    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;

        if (name === 'crop_id') {
            const selectedCrop = crops.find(c => c.crop_id.toString() === value);
            setCurrentCrop(selectedCrop);

            let defaultUnit = 'kg';
            let defaultFactor = 1.0;

            if (selectedCrop?.allowed_pricing_units?.length > 0) {
                defaultUnit = selectedCrop.allowed_pricing_units[0];
                defaultFactor = selectedCrop.conversion_factors[defaultUnit] || 1.0;
            }

            setFormState(prev => ({
                ...prev,
                [name]: value,
                purchasing_pricing_unit: defaultUnit,
                conversion_factor: defaultFactor
            }));
        } else if (name === 'purchasing_pricing_unit') {
            const factor = currentCrop?.conversion_factors?.[value] || 1.0;
            setFormState(prev => ({
                ...prev,
                [name]: value,
                conversion_factor: factor
            }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    }, [crops, currentCrop]);

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const quantity_kg = parseFloat(formState.quantity_input);
            // Price input is per Unit. Unit Price per KG = Price per Unit / Conversion Factor
            const unit_price_per_kg = parseFloat(formState.price_input) / parseFloat(formState.conversion_factor);

            const submissionData = {
                crop_id: parseInt(formState.crop_id),
                supplier_id: parseInt(formState.supplier_id),
                purchase_date: formState.purchase_date,
                quantity_kg,
                unit_price: unit_price_per_kg,
                purchasing_pricing_unit: formState.purchasing_pricing_unit,
                conversion_factor: formState.conversion_factor,
                amount_paid: parseFloat(formState.amount_paid) || 0,
                // Note: quantity_input is KG. We might want to save the calculated units in the note for reference.
                notes: `Original Input: ${formState.quantity_input} KG. Converted to approx ${(quantity_kg / formState.conversion_factor).toFixed(2)} ${formState.purchasing_pricing_unit} @ ${formState.price_input}/${formState.purchasing_pricing_unit}`
            };

            await createPurchase(submissionData);
            fetchPurchases();
            setFormState(getInitialFormState());
            setCurrentCrop(null);
            setShowAddForm(false);
            setError(null);
        } catch (err) {
            console.error("Failed to create purchase:", err);
            setError("Failed to create purchase.");
        }
    };

    // Payment handlers
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
            if (!response.ok) throw new Error('Failed to save payment.');
            handleCancelPayment();
            fetchPurchases();
        } catch (err) {
            console.error("Payment error:", err);
            setError(err.message);
        }
    };

    // Status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID': return <span className="badge bg-success">مدفوع</span>;
            case 'PARTIAL': return <span className="badge bg-warning text-dark">جزئي</span>;
            case 'PENDING':
            default: return <span className="badge bg-danger">معلق</span>;
        }
    };

    // Get unique crops for filter
    const uniqueCrops = useMemo(() => {
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

    // Set default filter
    useEffect(() => {
        if (uniqueCrops.length > 0 && selectedCropFilter === null && purchases.length > 0) {
            setSelectedCropFilter(uniqueCrops[0].crop.crop_id);
        }
    }, [uniqueCrops, purchases.length, selectedCropFilter]);

    // Filter purchases
    const filteredPurchases = useMemo(() => {
        return purchases.filter(purchase => {
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
    }, [purchases, searchTerm, selectedCropFilter]);

    // Calculate totals
    // quantity_input is now KG. 
    // calculatedQtyUnit = KG / Factor
    const calculatedQtyUnit = parseFloat(formState.quantity_input || 0) / parseFloat(formState.conversion_factor || 1);
    // Total Price = Units * PricePerUnit
    const calculatedTotal = calculatedQtyUnit * parseFloat(formState.price_input || 0);
    const calculatedQtyKg = parseFloat(formState.quantity_input || 0);

    return (
        <div className="container-fluid">
            {/* Payment Form Modal */}
            {showPaymentForm && payingPurchase && (
                <PaymentForm
                    purchase={payingPurchase}
                    onSave={handleSavePayment}
                    onCancel={handleCancelPayment}
                />
            )}

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

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

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
                <CropFilterTabs
                    uniqueCrops={uniqueCrops}
                    selectedCropFilter={selectedCropFilter}
                    onFilterChange={setSelectedCropFilter}
                    totalCount={purchases.length}
                />
            )}

            {/* Add Purchase Form */}
            {showAddForm && (
                <PurchaseForm
                    formState={formState}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowAddForm(false)}
                    crops={crops}
                    suppliers={suppliers}
                    currentCrop={currentCrop}
                    calculatedTotal={calculatedTotal}
                    calculatedQtyKg={calculatedQtyKg}
                    calculatedQtyUnit={calculatedQtyUnit}
                />
            )}

            {/* Purchases Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom">
                    <h5 className="mb-0" style={{ color: 'var(--text-primary)' }}>
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
                        <PurchasesTable
                            purchases={filteredPurchases}
                            onRecordPayment={handleRecordPayment}
                            getStatusBadge={getStatusBadge}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default PurchaseManagement;
