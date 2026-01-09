import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getLastSalePrice } from '../api/sales';
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from '../hooks/useSales';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import SalePaymentForm from '../components/SalePaymentForm';
import { EmptySales, EmptySearch } from '../components/EmptyState';
import { SaleForm, SalesTable, CropFilterTabs } from '../components/sales';
import { validateSaleForm } from '../utils/formValidation';
import { useToast } from '../components/common';

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
    amount_received: '',
    // New Fields for Complex Crops
    gross_quantity: '',
    bag_count: '',
    tare_weight: '',
    calculation_formula: ''
});

function SaleManagement() {
    const { crops, customers } = useData();
    const { hasPermission } = useAuth();
    const { showSuccess } = useToast();

    // TanStack Query - fetches sales data
    const { data: sales = [], isLoading, refetch: refetchSales } = useSales();
    const createMutation = useCreateSale();
    const updateMutation = useUpdateSale();
    const deleteMutation = useDeleteSale();

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCropFilter, setSelectedCropFilter] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [lastPriceHint, setLastPriceHint] = useState(null);

    // Use shared page state hook
    const { error, showError, clearError } = usePageState();

    // Payment modal state
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingSale, setPayingSale] = useState(null);

    // Form state
    const [currentCrop, setCurrentCrop] = useState(null);
    const [formState, setFormState] = useState(getInitialFormState());

    // Auto-fill Last Price
    useEffect(() => {
        const fetchLastPrice = async () => {
            if (formState.crop_id && formState.customer_id && !editingSale) {
                const lastData = await getLastSalePrice(formState.crop_id, formState.customer_id);
                if (lastData && lastData.selling_unit_price) {
                    setLastPriceHint({
                        price: lastData.selling_unit_price,
                        date: new Date(lastData.sale_date).toLocaleDateString('en-US')
                    });

                    // Auto-fill only if price field is empty
                    if (!formState.price_input) {
                        // Adjust price based on current unit
                        const factor = formState.specific_selling_factor || 1;
                        const pricePerUnit = lastData.selling_unit_price * factor;
                        setFormState(prev => ({ ...prev, price_input: pricePerUnit.toString() }));
                    }
                } else {
                    setLastPriceHint(null);
                }
            }
        };
        fetchLastPrice();
    }, [formState.crop_id, formState.customer_id, formState.selling_pricing_unit, formState.specific_selling_factor, editingSale]);

    // Input handler
    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;

        // Clear error when user types
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }

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
                specific_selling_factor: defaultFactor,
                // Reset complex fields
                gross_quantity: '',
                bag_count: '',
                tare_weight: '',
                quantity_input: ''
            }));
        } else if (name === 'selling_pricing_unit') {
            const factor = currentCrop?.conversion_factors?.[value] || 1.0;
            setFormState(prev => ({
                ...prev,
                [name]: value,
                specific_selling_factor: factor
            }));
        } else {
            // Complex Calculation Logic
            let updates = { [name]: value };

            if (currentCrop?.is_complex_unit) {
                let newGross = name === 'gross_quantity' ? parseFloat(value) || 0 : parseFloat(formState.gross_quantity) || 0;
                let newBags = name === 'bag_count' ? parseFloat(value) || 0 : parseFloat(formState.bag_count) || 0;
                let newTare = name === 'tare_weight' ? parseFloat(value) || 0 : parseFloat(formState.tare_weight) || 0;

                // Auto-calculate Tare from Bags if bag_count changed and default tare exists
                if (name === 'bag_count' && currentCrop.default_tare_per_bag) {
                    newTare = newBags * currentCrop.default_tare_per_bag;
                    updates.tare_weight = newTare;
                }

                // Calculate Net (quantity_input)
                // Gross - Tare = Net
                if (name === 'gross_quantity' || name === 'bag_count' || name === 'tare_weight') {
                    const netWeight = Math.max(0, newGross - newTare);
                    updates.quantity_input = netWeight; // This updates the Net Weight field automatically
                }
            }

            setFormState(prev => ({ ...prev, ...updates }));
        }
    }, [crops, currentCrop, formState, validationErrors]);

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate Form
        const validation = validateSaleForm(formState, currentCrop);
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            showError("يرجى تصحيح الأخطاء في النموذج");
            return;
        }

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
                // Complex Fields
                gross_quantity: formState.gross_quantity ? parseFloat(formState.gross_quantity) : null,
                bag_count: formState.bag_count ? parseInt(formState.bag_count) : 0,
                tare_weight: formState.tare_weight ? parseFloat(formState.tare_weight) : 0,
                calculation_formula: currentCrop?.is_complex_unit ? 'standard_diff' : null,

                notes: `الوزن الأصلي: ${quantity_sold_kg} كجم | الكمية بالوحدة: ${calculatedQtyUnit.toFixed(2)} ${formState.selling_pricing_unit}`
            };

            if (editingSale) {
                await updateMutation.mutateAsync({ saleId: editingSale.sale_id, data: submissionData });
                showSuccess("تم تحديث عملية البيع بنجاح");
                setEditingSale(null);
            } else {
                await createMutation.mutateAsync(submissionData);
                showSuccess("تم تسجيل عملية البيع بنجاح");
            }
            // No need to manually refetch - TanStack Query handles invalidation
            setFormState(getInitialFormState());
            setCurrentCrop(null);
            setShowAddForm(false);
            clearError();
            setValidationErrors({});
            setLastPriceHint(null);
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
        const message = `مرحبا ${sale.customer?.name}، \nمرفق فاتورة عملية البيع رقم ${sale.sale_id} بتاريخ ${new Date(sale.sale_date).toLocaleDateString('en-US')}.\nالمبلغ: ${sale.total_sale_amount.toLocaleString('en-US')} ج.م\nشكراً لتعاملك معنا.`;

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

    // Edit handler
    const handleEdit = (sale) => {
        setEditingSale(sale);
        setFormState({
            crop_id: sale.crop_id.toString(),
            customer_id: sale.customer_id.toString(),
            sale_date: sale.sale_date?.split('T')[0] || new Date().toISOString().slice(0, 10),
            quantity_input: sale.quantity_sold_kg?.toString() || '',
            price_input: (sale.selling_unit_price * (sale.specific_selling_factor || 1)).toString(),
            selling_pricing_unit: sale.selling_pricing_unit || 'kg',
            specific_selling_factor: sale.specific_selling_factor || 1.0,
            amount_received: sale.amount_received?.toString() || '',
            gross_quantity: '',
            bag_count: '',
            tare_weight: '',
            calculation_formula: ''
        });
        setCurrentCrop(crops.find(c => c.crop_id === sale.crop_id) || null);
        setShowAddForm(true);
    };

    // Delete handler
    const handleDelete = async (sale) => {
        if (!window.confirm(`هل أنت متأكد من حذف عملية البيع رقم ${sale.sale_id}؟`)) {
            return;
        }
        try {
            await deleteMutation.mutateAsync(sale.sale_id);
            // No need to manually refetch - TanStack Query handles invalidation
        } catch (err) {
            console.error("Failed to delete sale:", err);
            showError(err.response?.data?.detail || "فشل في حذف عملية البيع");
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
        <div className="p-6 max-w-full mx-auto">
            {/* Payment Form Modal */}
            {showPaymentForm && payingSale && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-slate-900/80 transition-opacity" aria-hidden="true" onClick={handleCancelPayment}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-transparent dark:border-slate-700">
                            <SalePaymentForm
                                sale={payingSale}
                                onSave={handleSavePayment}
                                onCancel={handleCancelPayment}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-1">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 me-3">
                            <i className="bi bi-cart-check text-xl"></i>
                        </div>
                        إدارة المبيعات
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 ms-14">إدارة وتتبع جميع عمليات البيع</p>
                </div>

                <div className="flex gap-3">
                    {hasPermission('sales:write') && (
                        <button
                            className={`inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-all ${showAddForm
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                            {showAddForm ? 'إلغاء' : 'إضافة عملية بيع جديدة'}
                        </button>
                    )}
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-s-4 border-red-400 dark:border-red-800 p-4 mb-6 rounded-md shadow-sm animate-fade-in relative" role="alert">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="bi bi-exclamation-triangle-fill text-red-400 dark:text-red-500 text-xl"></i>
                        </div>
                        <div className="ms-3">
                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">خطأ في النظام</p>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                        </div>
                        <div className="ms-auto ps-3">
                            <div className="-mx-1.5 -my-1.5">
                                <button
                                    onClick={clearError}
                                    type="button"
                                    className="inline-flex bg-red-50 dark:bg-transparent rounded-md p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <span className="sr-only">إغلاق</span>
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="w-full md:w-96 relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <i className="bi bi-search"></i>
                    </div>
                    <input
                        type="text"
                        className="block w-full pr-10 pl-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm transition-all hover:shadow-md"
                        placeholder="بحث بالعميل، المحصول أو رقم العملية..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Crop Filter Tabs */}
            {!showAddForm && uniqueCrops.length > 0 && (
                <div className="mb-6">
                    <CropFilterTabs
                        uniqueCrops={uniqueCrops}
                        selectedCropFilter={selectedCropFilter}
                        onFilterChange={setSelectedCropFilter}
                        totalCount={sales.length}
                    />
                </div>
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
                    validationErrors={validationErrors}
                    lastPriceHint={lastPriceHint}
                />
            )}

            {/* Sales Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center">
                        <i className="bi bi-list-ul me-2 text-emerald-600 dark:text-emerald-400"></i>
                        سجل المبيعات ({filteredSales.length})
                    </h5>
                </div>
                <div>
                    {filteredSales.length === 0 ? (
                        searchTerm ? (
                            <div className="p-8">
                                <EmptySearch searchTerm={searchTerm} />
                            </div>
                        ) : (
                            <div className="p-8">
                                <EmptySales onAdd={() => setShowAddForm(true)} />
                            </div>
                        )
                    ) : (
                        <SalesTable
                            sales={filteredSales}
                            onRecordPayment={handleRecordPayment}
                            onShareWhatsApp={handleShareWhatsApp}
                            onShareEmail={handleShareEmail}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            getStatusBadge={getStatusBadge}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default SaleManagement;
