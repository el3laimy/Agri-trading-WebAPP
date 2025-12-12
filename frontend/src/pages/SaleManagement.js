import React, { useState, useEffect } from 'react';
import { getSales, createSale, downloadInvoice } from '../api/sales';
import { useData } from '../context/DataContext';
import SalePaymentForm from '../components/SalePaymentForm';
import { EmptySales, EmptySearch } from '../components/EmptyState';

function SaleManagement() {
    const { crops, customers } = useData();
    const [sales, setSales] = useState([]);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCropFilter, setSelectedCropFilter] = useState(null); // null = all, or crop_id

    // State for the payment modal
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingSale, setPayingSale] = useState(null);

    // State for flexible units
    const [currentCrop, setCurrentCrop] = useState(null);

    const [formState, setFormState] = useState({
        crop_id: '',
        customer_id: '',
        sale_date: new Date().toISOString().slice(0, 10),
        quantity_input: '',     // Quantity in selected unit
        price_input: '',        // Price per selected unit
        selling_pricing_unit: 'kg',
        specific_selling_factor: 1.0,
        amount_received: ''
    });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const salesData = await getSales();
            setSales(salesData);
        } catch (error) {
            console.error("Failed to fetch sales:", error);
            setError("Failed to load sales.");
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
                selling_pricing_unit: defaultUnit,
                specific_selling_factor: defaultFactor
            }));
        } else if (name === 'selling_pricing_unit') {
            // Find conversion factor for selected unit
            const factor = currentCrop?.conversion_factors?.[value] || 1.0;
            setFormState(prevState => ({
                ...prevState,
                [name]: value,
                specific_selling_factor: factor
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
            const quantity_sold_kg = parseFloat(formState.quantity_input) * parseFloat(formState.specific_selling_factor);
            // Unit price in DB should be per KG for consistency
            const selling_unit_price_per_kg = parseFloat(formState.price_input) / parseFloat(formState.specific_selling_factor);

            const submissionData = {
                crop_id: parseInt(formState.crop_id),
                customer_id: parseInt(formState.customer_id),
                sale_date: formState.sale_date,
                quantity_sold_kg: quantity_sold_kg,
                selling_unit_price: selling_unit_price_per_kg,
                selling_pricing_unit: formState.selling_pricing_unit,
                specific_selling_factor: parseFloat(formState.specific_selling_factor),
                amount_received: parseFloat(formState.amount_received) || 0,
                // Add notes or handle description if needed, logic similar to purchase can be added here
            };

            await createSale(submissionData);
            fetchSales();
            setFormState({
                crop_id: '',
                customer_id: '',
                sale_date: new Date().toISOString().slice(0, 10),
                quantity_input: '',
                price_input: '',
                selling_pricing_unit: 'kg',
                specific_selling_factor: 1.0,
                amount_received: ''
            });
            setCurrentCrop(null);
            setShowAddForm(false);
            setError(null);
        } catch (error) {
            console.error("Failed to create sale:", error);
            setError(error.response?.data?.detail || "An unexpected error occurred.");
        }
    };

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
            if (!response.ok) {
                throw new Error('Failed to save payment.');
            }
            handleCancelPayment();
            fetchSales();
        } catch (error) {
            console.error("Payment error:", error);
            setError(error.message);
        }
    };

    const handleShareWhatsApp = (sale) => {
        const phone = sale.customer?.phone;
        const message = `مرحبا ${sale.customer?.name}، \nمرفق فاتورة عملية البيع رقم ${sale.sale_id} بتاريخ ${new Date(sale.sale_date).toLocaleDateString('ar-EG')}.\nالمبلغ: ${sale.total_sale_amount.toLocaleString('ar-EG')} ج.م\nشكراً لتعاملك معنا.`;

        if (!phone) {
            alert("رقم هاتف العميل غير مسجل");
            return;
        }

        // Basic clean up
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('01')) cleanPhone = '2' + cleanPhone;

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
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
        } catch (error) {
            console.error(error);
            alert("فشل في إرسال البريد الإلكتروني");
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

    // Get unique crops from sales for filter tabs
    const uniqueCrops = React.useMemo(() => {
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

    // Set default filter to most used crop on first load
    React.useEffect(() => {
        if (uniqueCrops.length > 0 && selectedCropFilter === null && sales.length > 0) {
            setSelectedCropFilter(uniqueCrops[0].crop.crop_id);
        }
    }, [uniqueCrops, sales.length]);

    // Filter sales based on search term AND selected crop
    const filteredSales = sales.filter(sale => {
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

    // Calculate totals for summary/preview
    const calculatedTotal = (parseFloat(formState.quantity_input || 0) * parseFloat(formState.price_input || 0));
    const calculatedQtyKg = (parseFloat(formState.quantity_input || 0) * parseFloat(formState.specific_selling_factor || 1));


    return (
        <div className="container-fluid">
            {showPaymentForm && payingSale &&
                <SalePaymentForm
                    sale={payingSale}
                    onSave={handleSavePayment}
                    onCancel={handleCancelPayment}
                />
            }

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
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <span className="text-muted me-2"><i className="bi bi-funnel me-1"></i>فلترة:</span>
                            <button
                                className={`btn btn-sm ${selectedCropFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setSelectedCropFilter('all')}
                            >
                                الكل ({sales.length})
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

            {/* Add Sale Form */}
            {showAddForm && (
                <div className="card border-0 shadow-sm mb-4 fade-in">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-plus-circle me-2"></i>
                            عملية بيع جديدة
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
                                    <label className="form-label fw-bold">العميل</label>
                                    <select
                                        className="form-select"
                                        name="customer_id"
                                        value={formState.customer_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">اختر العميل</option>
                                        {customers.map(customer => (
                                            <option key={customer.contact_id} value={customer.contact_id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">تاريخ البيع</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="sale_date"
                                        value={formState.sale_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">وحدة التسعير</label>
                                    <select
                                        className="form-select"
                                        name="selling_pricing_unit"
                                        value={formState.selling_pricing_unit}
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
                                    <label className="form-label text-muted">عامل التحويل</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={`${formState.specific_selling_factor} كجم / ${formState.selling_pricing_unit}`}
                                        disabled
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">الكمية ({formState.selling_pricing_unit})</label>
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
                                    <label className="form-label fw-bold">السعر (لكل {formState.selling_pricing_unit})</label>
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
                                    <label className="form-label fw-bold">المبلغ المستلم (ج.م)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="amount_received"
                                        value={formState.amount_received}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                    />
                                    <div className="form-text">اتركه فارغاً للبيع الآجل بالكامل</div>
                                </div>
                                <div className="col-12">
                                    <div className="alert alert-info d-flex align-items-center">
                                        <i className="bi bi-calculator me-2 fs-5"></i>
                                        <div>
                                            <strong>تفاصيل العملية:</strong><br />
                                            الكمية المباعة: {calculatedQtyKg.toFixed(2)} كجم<br />
                                            الإجمالي المتوقع: {calculatedTotal.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
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
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>المحصول</th>
                                        <th>العميل</th>
                                        <th className="text-center">الكمية</th>
                                        <th className="text-center">السعر</th>
                                        <th className="text-center">الإجمالي</th>
                                        <th>التاريخ</th>
                                        <th className="text-center">الحالة</th>
                                        <th style={{ width: '180px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map(s => {
                                        // Display logic for original units 
                                        const originalUnit = s.selling_pricing_unit || 'kg';
                                        const factor = s.specific_selling_factor || 1.0;
                                        const originalQty = (s.quantity_sold_kg || 0) / factor;
                                        const originalPrice = (s.selling_unit_price || 0) * factor;

                                        return (
                                            <tr key={s.sale_id}>
                                                <td>
                                                    <span className="badge bg-success-subtle text-success">
                                                        <i className="bi bi-flower1 me-1"></i>
                                                        {s.crop?.crop_name || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <i className="bi bi-person me-1 text-primary"></i>
                                                    {s.customer?.name || 'N/A'}
                                                </td>
                                                <td className="text-center">
                                                    <strong>{originalQty.toFixed(0)}</strong>
                                                    <small className="text-muted ms-1">{originalUnit}</small>
                                                </td>
                                                <td className="text-center">
                                                    {originalPrice.toLocaleString('ar-EG')}
                                                    <small className="text-muted">/{originalUnit}</small>
                                                </td>
                                                <td className="text-center fw-bold text-success">
                                                    {(s.total_sale_amount || 0).toLocaleString('ar-EG')} ج.م
                                                </td>
                                                <td>
                                                    <small>{new Date(s.sale_date).toLocaleDateString('ar-EG')}</small>
                                                </td>
                                                <td className="text-center">{getStatusBadge(s.payment_status)}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-success ms-1"
                                                        onClick={() => handleRecordPayment(s)}
                                                        disabled={s.payment_status === 'PAID'}
                                                    >
                                                        <i className="bi bi-cash me-1"></i>
                                                        تسجيل دفعة
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => downloadInvoice(s.sale_id)}
                                                        title="طباعة الفاتورة"
                                                    >
                                                        <i className="bi bi-printer"></i>
                                                    </button>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-outline-secondary dropdown-toggle"
                                                            data-bs-toggle="dropdown"
                                                            aria-expanded="false"
                                                        >
                                                            <i className="bi bi-share"></i>
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                            <li>
                                                                <button className="dropdown-item" onClick={() => handleShareWhatsApp(s)}>
                                                                    <i className="bi bi-whatsapp text-success me-2"></i> واتساب
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button className="dropdown-item" onClick={() => handleShareEmail(s)}>
                                                                    <i className="bi bi-envelope text-primary me-2"></i> بريد إلكتروني
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
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

export default SaleManagement;
