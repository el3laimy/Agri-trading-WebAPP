import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSales, createSale } from '../api/sales';
import { useData } from '../context/DataContext';
import SalePaymentForm from '../components/SalePaymentForm';
import { EmptySales, EmptySearch } from '../components/EmptyState';
import { SaleForm, SalesTable, CropFilterTabs } from '../components/sales';

// Import shared utilities and components
import { usePageState } from '../hooks';
import { formatPhoneForWhatsApp } from '../utils';

// Initial form state
const getInitialFormState = () => ({
    crop_id: '',
    customer_id: '',
    sale_date: new Date().toISOString().slice(0, 10),
    quantity_input: '',
    price_input: '',
    selling_pricing_unit: 'kg',
    specific_selling_factor: 1.0,
    amount_received: ''
});

function SaleManagement() {
    const { crops, customers } = useData();
    const [sales, setSales] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCropFilter, setSelectedCropFilter] = useState(null);

    // Use shared page state hook
    const { error, showError, clearError } = usePageState();

    // Payment modal state
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingSale, setPayingSale] = useState(null);

    // Form state
    const [currentCrop, setCurrentCrop] = useState(null);
    const [formState, setFormState] = useState(getInitialFormState());

    // Fetch sales
    const fetchSales = useCallback(async () => {
        try {
            const salesData = await getSales();
            setSales(salesData);
        } catch (err) {
            console.error("Failed to fetch sales:", err);
            showError("Failed to load sales.");
        }
    }, [showError]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

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
                selling_pricing_unit: defaultUnit,
                specific_selling_factor: defaultFactor
            }));
        } else if (name === 'selling_pricing_unit') {
            const factor = currentCrop?.conversion_factors?.[value] || 1.0;
            setFormState(prev => ({
                ...prev,
                [name]: value,
                specific_selling_factor: factor
            }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    }, [crops, currentCrop]);

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // quantity_input is now in KG (like purchases)
            const quantity_sold_kg = parseFloat(formState.quantity_input);
            const selling_unit_price_per_kg = parseFloat(formState.price_input) / parseFloat(formState.specific_selling_factor);
            const calculatedQtyUnit = quantity_sold_kg / parseFloat(formState.specific_selling_factor);

            const submissionData = {
                crop_id: parseInt(formState.crop_id),
                customer_id: parseInt(formState.customer_id),
                sale_date: formState.sale_date,
                quantity_sold_kg,
                selling_unit_price: selling_unit_price_per_kg,
                selling_pricing_unit: formState.selling_pricing_unit,
                specific_selling_factor: parseFloat(formState.specific_selling_factor),
                amount_received: parseFloat(formState.amount_received) || 0,
                notes: `الوزن الأصلي: ${quantity_sold_kg} كجم | الكمية بالوحدة: ${calculatedQtyUnit.toFixed(2)} ${formState.selling_pricing_unit}`
            };

            await createSale(submissionData);
            fetchSales();
            setFormState(getInitialFormState());
            setCurrentCrop(null);
            setShowAddForm(false);
            clearError();
        } catch (err) {
            console.error("Failed to create sale:", err);
            showError(err.response?.data?.detail || "An unexpected error occurred.");
        }
    };

    // Payment handlers
    const handleRecordPayment = (sale) => {
        setPayingSale(sale);
        setShowPaymentForm(true);
    };

    const handleCancelPayment = () => {
        setShowPaymentForm(false);
        setPayingSale(null);
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
            fetchSales();
        } catch (err) {
            console.error("Payment error:", err);
            showError(err.message);
        }
    };

    // Share handlers - using formatPhoneForWhatsApp utility
    const handleShareWhatsApp = (sale) => {
        const phone = sale.customer?.phone;
        const message = `مرحبا ${sale.customer?.name}، \nمرفق فاتورة عملية البيع رقم ${sale.sale_id} بتاريخ ${new Date(sale.sale_date).toLocaleDateString('ar-EG')}.\nالمبلغ: ${sale.total_sale_amount.toLocaleString('ar-EG')} ج.م\nشكراً لتعاملك معنا.`;

        if (!phone) {
            alert("رقم هاتف العميل غير مسجل");
            return;
        }

        const cleanPhone = formatPhoneForWhatsApp(phone);
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShareEmail = async (sale) => {
        const email = prompt("أدخل البريد الإلكتروني للعميل:", sale.customer?.email || "");
        if (!email) return;

        try {
            await fetch(`http://localhost:8000/api/v1/sales/${sale.sale_id}/share/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            alert("تم إرسال الفاتورة بنجاح");
        } catch (err) {
            console.error(err);
            alert("فشل في إرسال البريد الإلكتروني");
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
        sales.forEach(sale => {
            if (sale.crop) {
                const existing = cropMap.get(sale.crop.crop_id) || { count: 0, crop: sale.crop };
                existing.count++;
                cropMap.set(sale.crop.crop_id, existing);
            }
        });
        return Array.from(cropMap.values()).sort((a, b) => b.count - a.count);
    }, [sales]);

    // Set default filter
    useEffect(() => {
        if (uniqueCrops.length > 0 && selectedCropFilter === null && sales.length > 0) {
            setSelectedCropFilter(uniqueCrops[0].crop.crop_id);
        }
    }, [uniqueCrops, sales.length, selectedCropFilter]);

    // Filter sales
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchesSearch = (
                sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.crop?.crop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.sale_id?.toString().includes(searchTerm)
            );
            const matchesCrop = selectedCropFilter === 'all' || selectedCropFilter === null
                ? true
                : sale.crop?.crop_id === selectedCropFilter;
            return matchesSearch && matchesCrop;
        });
    }, [sales, searchTerm, selectedCropFilter]);

    // Calculate totals - quantity_input is now in KG
    const calculatedQtyKg = parseFloat(formState.quantity_input || 0);
    const calculatedQtyUnit = calculatedQtyKg / parseFloat(formState.specific_selling_factor || 1);
    const calculatedTotal = calculatedQtyUnit * parseFloat(formState.price_input || 0);

    return (
        <div className="container-fluid">
            {/* Payment Form Modal */}
            {showPaymentForm && payingSale && (
                <SalePaymentForm
                    sale={payingSale}
                    onSave={handleSavePayment}
                    onCancel={handleCancelPayment}
                />
            )}

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-cart-check me-2"></i>
                        إدارة المبيعات
                    </h2>
                    <p className="text-muted">إدارة وتتبع جميع عمليات البيع</p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={clearError}></button>
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
                            placeholder="بحث بالعميل، المحصول أو رقم العملية..."
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
                        {showAddForm ? 'إلغاء' : 'إضافة عملية بيع جديدة'}
                    </button>
                </div>
            </div>

            {/* Crop Filter Tabs */}
            {!showAddForm && uniqueCrops.length > 0 && (
                <CropFilterTabs
                    uniqueCrops={uniqueCrops}
                    selectedCropFilter={selectedCropFilter}
                    onFilterChange={setSelectedCropFilter}
                    totalCount={sales.length}
                />
            )}

            {/* Add Sale Form */}
            {showAddForm && (
                <SaleForm
                    formState={formState}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowAddForm(false)}
                    crops={crops}
                    customers={customers}
                    currentCrop={currentCrop}
                    calculatedTotal={calculatedTotal}
                    calculatedQtyKg={calculatedQtyKg}
                    calculatedQtyUnit={calculatedQtyUnit}
                />
            )}

            {/* Sales Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        سجل المبيعات ({filteredSales.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredSales.length === 0 ? (
                        searchTerm ? (
                            <div className="p-4">
                                <EmptySearch searchTerm={searchTerm} />
                            </div>
                        ) : (
                            <div className="p-4">
                                <EmptySales onAdd={() => setShowAddForm(true)} />
                            </div>
                        )
                    ) : (
                        <SalesTable
                            sales={filteredSales}
                            onRecordPayment={handleRecordPayment}
                            onShareWhatsApp={handleShareWhatsApp}
                            onShareEmail={handleShareEmail}
                            getStatusBadge={getStatusBadge}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default SaleManagement;
