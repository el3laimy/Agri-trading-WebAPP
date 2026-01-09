import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getLastPurchasePrice } from '../api/purchases';
import { usePurchases, useCreatePurchase, useUpdatePurchase, useDeletePurchase } from '../hooks/usePurchases';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import PaymentForm from '../components/PaymentForm';
import { CropFilterTabs } from '../components/sales';
import { PurchaseForm, PurchasesTable } from '../components/purchases';
import { validatePurchaseForm } from '../utils/formValidation';
import { useToast } from '../components/common';

// Initial form state
const getInitialFormState = () => ({
    crop_id: '',
    supplier_id: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    quantity_input: '',
    price_input: '',
    purchasing_pricing_unit: 'kg',
    conversion_factor: 1.0,
    amount_paid: '',
    // Fields for Complex Crops
    gross_quantity: '',
    bag_count: '',
    tare_per_bag: '',  // العيار/كيس - يدخله المستخدم
    tare_weight: '',   // إجمالي العيار (محسوب)
    calculation_formula: 'qantar_government' // الافتراضي: حكومي
});

function PurchaseManagement() {
    const { crops, suppliers } = useData();
    const { hasPermission } = useAuth();
    const { showSuccess, showError } = useToast();

    // TanStack Query - fetches purchases data
    const { data: purchases = [], isLoading, refetch: refetchPurchases } = usePurchases();
    const createMutation = useCreatePurchase();
    const updateMutation = useUpdatePurchase();
    const deleteMutation = useDeletePurchase();

    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCropFilter, setSelectedCropFilter] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [lastPriceHint, setLastPriceHint] = useState(null);

    // Payment modal state
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingPurchase, setPayingPurchase] = useState(null);

    // Form state
    const [currentCrop, setCurrentCrop] = useState(null);
    const [formState, setFormState] = useState(getInitialFormState());

    // Auto-fill Last Price
    useEffect(() => {
        const fetchLastPrice = async () => {
            if (formState.crop_id && formState.supplier_id && !editingPurchase) {
                const lastData = await getLastPurchasePrice(formState.crop_id, formState.supplier_id);
                if (lastData && lastData.unit_price) {
                    setLastPriceHint({
                        price: lastData.unit_price,
                        date: new Date(lastData.purchase_date).toLocaleDateString('en-US')
                    });

                    // Auto-fill only if price field is empty
                    if (!formState.price_input) {
                        // Adjust price based on current unit
                        const factor = formState.conversion_factor || 1;
                        const pricePerUnit = lastData.unit_price * factor;
                        setFormState(prev => ({ ...prev, price_input: pricePerUnit.toString() }));
                    }
                } else {
                    setLastPriceHint(null);
                }
            }
        };
        fetchLastPrice();
    }, [formState.crop_id, formState.supplier_id, formState.purchasing_pricing_unit, formState.conversion_factor, editingPurchase]);

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
                purchasing_pricing_unit: defaultUnit,
                conversion_factor: defaultFactor,
                // Reset complex fields when crop changes
                gross_quantity: '',
                bag_count: '',
                tare_per_bag: '',
                tare_weight: '',
                quantity_input: ''
            }));
        } else if (name === 'purchasing_pricing_unit') {
            const factor = currentCrop?.conversion_factors?.[value] || 1.0;
            setFormState(prev => ({
                ...prev,
                [name]: value,
                conversion_factor: factor
            }));
        } else {
            // Complex Calculation Logic
            let updates = { [name]: value };

            if (currentCrop?.is_complex_unit) {
                let newGross = name === 'gross_quantity' ? parseFloat(value) || 0 : parseFloat(formState.gross_quantity) || 0;
                let newBags = name === 'bag_count' ? parseFloat(value) || 0 : parseFloat(formState.bag_count) || 0;
                let newTarePerBag = name === 'tare_per_bag' ? parseFloat(value) || 0 : parseFloat(formState.tare_per_bag) || currentCrop.default_tare_per_bag || 0;

                // Auto-calculate Total Tare = Bags × Tare per Bag
                if (name === 'bag_count' || name === 'tare_per_bag') {
                    const totalTare = newBags * newTarePerBag;
                    updates.tare_weight = totalTare;
                }

                // Calculate Net (quantity_input) = Gross - Tare
                if (name === 'gross_quantity' || name === 'bag_count' || name === 'tare_per_bag') {
                    const totalTare = newBags * newTarePerBag;
                    const netWeight = Math.max(0, newGross - totalTare);
                    updates.quantity_input = netWeight;
                    updates.tare_weight = totalTare;
                }

                // Update tare_per_bag when it changes
                if (name === 'tare_per_bag') {
                    updates.tare_per_bag = value;
                }
            }

            setFormState(prev => ({ ...prev, ...updates }));
        }
    }, [crops, currentCrop, formState, validationErrors]);

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate Form
        const validation = validatePurchaseForm(formState, currentCrop);
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            showError("يرجى تصحيح الأخطاء في النموذج");
            return;
        }

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
                // Complex Fields
                gross_quantity: formState.gross_quantity ? parseFloat(formState.gross_quantity) : null,
                bag_count: formState.bag_count ? parseInt(formState.bag_count) : 0,
                tare_weight: formState.tare_weight ? parseFloat(formState.tare_weight) : 0,
                calculation_formula: currentCrop?.is_complex_unit ? formState.calculation_formula : null,

                // Note: quantity_input is KG. We might want to save the calculated units in the note for reference.
                notes: `Original Input: ${formState.quantity_input} KG. Converted to approx ${(quantity_kg / formState.conversion_factor).toFixed(2)} ${formState.purchasing_pricing_unit} @ ${formState.price_input}/${formState.purchasing_pricing_unit}`
            };

            if (editingPurchase) {
                await updateMutation.mutateAsync({ purchaseId: editingPurchase.purchase_id, data: submissionData });
                showSuccess("تم تحديث عملية الشراء بنجاح");
                setEditingPurchase(null);
            } else {
                await createMutation.mutateAsync(submissionData);
                showSuccess("تم تسجيل عملية الشراء بنجاح");
            }
            // No need to manually refetch - TanStack Query handles invalidation
            setFormState(getInitialFormState());
            setCurrentCrop(null);
            setShowAddForm(false);
            setError(null);
            setValidationErrors({});
            setLastPriceHint(null);
        } catch (err) {
            console.error("Failed to create purchase:", err);
            setError("Failed to create purchase.");
            showError("فشل في تسجيل العملية");
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
            refetchPurchases(); // Use TanStack Query refetch
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

    // Edit handler
    const handleEdit = (purchase) => {
        setEditingPurchase(purchase);
        setFormState({
            crop_id: purchase.crop_id.toString(),
            supplier_id: purchase.supplier_id.toString(),
            purchase_date: purchase.purchase_date?.split('T')[0] || new Date().toISOString().slice(0, 10),
            quantity_input: purchase.quantity_kg?.toString() || '',
            price_input: (purchase.unit_price * (purchase.conversion_factor || 1)).toString(),
            purchasing_pricing_unit: purchase.purchasing_pricing_unit || 'kg',
            conversion_factor: purchase.conversion_factor || 1.0,
            amount_paid: purchase.amount_paid?.toString() || '',
            gross_quantity: '',
            bag_count: '',
            tare_per_bag: '',
            tare_weight: '',
            calculation_formula: 'qantar_government'
        });
        setCurrentCrop(crops.find(c => c.crop_id === purchase.crop_id) || null);
        setShowAddForm(true);
    };

    // Delete handler
    const handleDelete = async (purchase) => {
        if (!window.confirm(`هل أنت متأكد من حذف عملية الشراء رقم ${purchase.purchase_id}؟`)) {
            return;
        }
        try {
            await deleteMutation.mutateAsync(purchase.purchase_id);
            // No need to manually refetch - TanStack Query handles invalidation
        } catch (err) {
            console.error("Failed to delete purchase:", err);
            setError(err.response?.data?.detail || "فشل في حذف عملية الشراء");
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
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            {/* Payment Form Modal */}
            {showPaymentForm && payingPurchase && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500/75 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={handleCancelPayment}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <PaymentForm
                                purchase={payingPurchase}
                                onSave={handleSavePayment}
                                onCancel={handleCancelPayment}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <div className="w-full">
                    <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400 flex items-center transition-colors">
                        <i className="bi bi-bag-check ml-2"></i>
                        إدارة المشتريات
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">إدارة وتتبع جميع عمليات الشراء</p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 p-4 mb-6 relative rounded-md shadow-sm transition-colors" role="alert">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="bi bi-exclamation-triangle-fill text-red-400 dark:text-red-500 text-xl ml-3"></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                        </div>
                        <button
                            type="button"
                            className="absolute top-0 left-0 mt-4 ml-4 text-red-400 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            onClick={() => setError(null)}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full md:w-1/2">
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <i className="bi bi-search text-gray-400"></i>
                        </div>
                        <input
                            type="text"
                            className="block w-full pr-10 pl-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg leading-5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm"
                            placeholder="بحث بالمورد، المحصول أو رقم العملية..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto flex justify-end">
                    {hasPermission('purchases:write') && (
                        <button
                            className={`inline-flex items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white transition-all duration-200 ${showAddForm
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} ml-2`}></i>
                            {showAddForm ? 'إلغاء' : 'إضافة عملية شراء جديدة'}
                        </button>
                    )}
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
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 mb-8 overflow-hidden animate-slide-down transition-colors">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 transition-colors">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className="bi bi-plus-circle-fill ml-2 text-emerald-600 dark:text-emerald-500"></i>
                            تسجيل عملية شراء جديدة
                        </h3>
                    </div>
                    <div className="p-6">
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
                            validationErrors={validationErrors}
                            lastPriceHint={lastPriceHint}
                        />
                    </div>
                </div>
            )}

            {/* Purchases Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center transition-colors">
                    <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-0 flex items-center">
                        <i className="bi bi-list-ul ml-2 text-emerald-600 dark:text-emerald-500"></i>
                        سجل المشتريات
                        <span className="mr-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 py-0.5 px-2.5 rounded-full text-xs font-semibold transition-colors">
                            {filteredPurchases.length}
                        </span>
                    </h5>
                    <button onClick={() => refetchPurchases()} className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="تحديث البيانات">
                        <i className="bi bi-arrow-clockwise text-lg"></i>
                    </button>
                </div>
                <div className="p-0">
                    {filteredPurchases.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 transition-colors">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mb-4 transition-colors">
                                <i className="bi bi-inbox text-3xl text-gray-400 dark:text-gray-500"></i>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">لا توجد عمليات شراء مسجلة</p>
                            <button
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                                onClick={() => setShowAddForm(true)}
                            >
                                <i className="bi bi-plus-lg ml-2"></i>
                                إضافة أول عملية شراء
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <PurchasesTable
                                purchases={filteredPurchases}
                                onRecordPayment={handleRecordPayment}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                getStatusBadge={getStatusBadge}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PurchaseManagement;
