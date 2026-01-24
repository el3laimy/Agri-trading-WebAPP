import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getLastPurchasePrice } from '../api/purchases';
import { usePurchases, useCreatePurchase, useUpdatePurchase, useDeletePurchase } from '../hooks/usePurchases';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import PaymentForm from '../components/PaymentForm';
import { PurchaseForm, PurchasesTable } from '../components/purchases';
import { validatePurchaseForm } from '../utils/formValidation';
import { useToast } from '../components/common';
import { safeParseFloat, safeParseInt } from '../utils/mathUtils';

// Import new components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';
import { PurchasesTrendChart, PurchasesByStatusChart, TopSuppliersChart, PurchasesStatsCards } from '../components/purchases/charts/PurchasesCharts';

// Import CSS animations
import '../styles/dashboardAnimations.css';

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
    gross_quantity: '',
    bag_count: '',
    tare_per_bag: '',
    tare_weight: '',
    calculation_formula: 'qantar_government'
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

    // Charts visibility toggle
    const [showCharts, setShowCharts] = useState(true);

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

                    if (!formState.price_input) {
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
            let updates = { [name]: value };

            if (currentCrop?.is_complex_unit) {
                let newGross = name === 'gross_quantity' ? parseFloat(value) || 0 : parseFloat(formState.gross_quantity) || 0;
                let newBags = name === 'bag_count' ? parseFloat(value) || 0 : parseFloat(formState.bag_count) || 0;
                let newTarePerBag = name === 'tare_per_bag' ? parseFloat(value) || 0 : parseFloat(formState.tare_per_bag) || currentCrop.default_tare_per_bag || 0;

                if (name === 'bag_count' || name === 'tare_per_bag') {
                    const totalTare = newBags * newTarePerBag;
                    updates.tare_weight = totalTare;
                }

                if (name === 'gross_quantity' || name === 'bag_count' || name === 'tare_per_bag') {
                    const totalTare = newBags * newTarePerBag;
                    const netWeight = Math.max(0, newGross - totalTare);
                    updates.quantity_input = netWeight;
                    updates.tare_weight = totalTare;
                }

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

        const validation = validatePurchaseForm(formState, currentCrop);
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            showError("يرجى تصحيح الأخطاء في النموذج");
            return;
        }

        try {
            const quantity_kg = parseFloat(formState.quantity_input);
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
                gross_quantity: formState.gross_quantity ? parseFloat(formState.gross_quantity) : null,
                bag_count: formState.bag_count ? parseInt(formState.bag_count) : 0,
                tare_weight: formState.tare_weight ? parseFloat(formState.tare_weight) : 0,
                calculation_formula: currentCrop?.is_complex_unit ? formState.calculation_formula : null,
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
            const apiClient = (await import('../api/client')).default;
            await apiClient.post('/payments/', paymentData);
            handleCancelPayment();
            refetchPurchases();
        } catch (err) {
            console.error("Payment error:", err);
            setError(err.response?.data?.detail || err.message);
        }
    };

    // Status badge - Enhanced design
    const getStatusBadge = (status) => {
        const badges = {
            PAID: (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                    <i className="bi bi-check-circle-fill text-[10px]" />
                    مدفوع
                </span>
            ),
            PARTIAL: (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <i className="bi bi-clock-fill text-[10px]" />
                    جزئي
                </span>
            ),
            PENDING: (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <i className="bi bi-exclamation-circle-fill text-[10px]" />
                    معلق
                </span>
            )
        };
        return badges[status] || badges.PENDING;
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
            setSelectedCropFilter('all');
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

    // Calculate totals - SAFE PARSING
    const calculatedQtyKg = safeParseFloat(formState.quantity_input);
    const calculatedQtyUnit = calculatedQtyKg / safeParseFloat(formState.conversion_factor, 1);
    const calculatedTotal = calculatedQtyUnit * safeParseFloat(formState.price_input);

    // Loading state
    if (isLoading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800/30 dark:to-cyan-800/30" />
                </div>
                <div className="neumorphic p-6">
                    <LoadingCard rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Payment Form Modal */}
            {showPaymentForm && payingPurchase && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCancelPayment}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-slate-700 animate-fade-in-scale">
                            <PaymentForm
                                purchase={payingPurchase}
                                onSave={handleSavePayment}
                                onCancel={handleCancelPayment}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header with Stats */}
            <PageHeader
                title="إدارة المشتريات"
                subtitle="إدارة وتتبع جميع عمليات الشراء والمدفوعات"
                icon="bi-bag-check"
                gradient="from-blue-500 to-cyan-500"
                actions={
                    <>
                        <button
                            onClick={() => setShowCharts(!showCharts)}
                            className={`p-3 rounded-xl transition-all ${showCharts ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70'}`}
                            title="إظهار/إخفاء الرسوم البيانية"
                        >
                            <i className="bi bi-graph-up" />
                        </button>
                        {hasPermission('purchases:write') && (
                            <ActionButton
                                label={showAddForm ? 'إلغاء' : 'إضافة عملية شراء'}
                                icon={showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}
                                onClick={() => setShowAddForm(!showAddForm)}
                                variant={showAddForm ? 'danger' : 'primary'}
                            />
                        )}
                    </>
                }
            >
                {/* Stats Cards */}
                <PurchasesStatsCards purchases={purchases} />
            </PageHeader>

            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <i className="bi bi-exclamation-triangle-fill text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-red-700 dark:text-red-400">خطأ في النظام</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-1">
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {showCharts && purchases.length > 0 && !showAddForm && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fade-in">
                    {/* Trend Chart */}
                    <div className="lg:col-span-2 neumorphic p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <i className="bi bi-graph-up text-blue-500" />
                            اتجاه المشتريات
                        </h3>
                        <PurchasesTrendChart purchases={purchases} />
                    </div>

                    {/* Status Chart */}
                    <div className="neumorphic p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <i className="bi bi-pie-chart text-cyan-500" />
                            حالة الدفع
                        </h3>
                        <PurchasesByStatusChart purchases={purchases} />
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث بالمورد، المحصول أو رقم العملية..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Crop Filter Chips */}
            {!showAddForm && uniqueCrops.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <FilterChip
                        label="الكل"
                        count={purchases.length}
                        icon="bi-grid"
                        active={selectedCropFilter === 'all'}
                        onClick={() => setSelectedCropFilter('all')}
                        color="blue"
                    />
                    {uniqueCrops.map(({ crop, count }) => (
                        <FilterChip
                            key={crop.crop_id}
                            label={crop.crop_name}
                            count={count}
                            icon="bi-flower1"
                            active={selectedCropFilter === crop.crop_id}
                            onClick={() => setSelectedCropFilter(crop.crop_id)}
                            color="blue"
                        />
                    ))}
                </div>
            )}

            {/* Add Purchase Form */}
            {showAddForm && (
                <div className="mb-6 neumorphic overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <i className="bi bi-plus-circle-fill ml-2 text-blue-600 dark:text-blue-400" />
                            {editingPurchase ? 'تعديل عملية الشراء' : 'تسجيل عملية شراء جديدة'}
                        </h3>
                    </div>
                    <div className="p-6">
                        <PurchaseForm
                            formState={formState}
                            onInputChange={handleInputChange}
                            onSubmit={handleSubmit}
                            onCancel={() => { setShowAddForm(false); setEditingPurchase(null); }}
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
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-blue-500" />
                        سجل المشتريات
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {filteredPurchases.length}
                        </span>
                    </h5>

                    {/* Top Suppliers Mini Chart (Desktop only) */}
                    {purchases.length > 0 && (
                        <div className="hidden lg:block w-64">
                            <TopSuppliersChart purchases={purchases} />
                        </div>
                    )}
                </div>
                <div>
                    {filteredPurchases.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                                <i className="bi bi-inbox text-5xl text-blue-400 dark:text-blue-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد عمليات شراء</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">لم يتم تسجيل أي عمليات شراء بعد</p>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all hover-scale"
                            >
                                <i className="bi bi-plus-lg ml-2" />
                                إضافة أول عملية شراء
                            </button>
                        </div>
                    ) : (
                        <PurchasesTable
                            purchases={filteredPurchases}
                            onRecordPayment={handleRecordPayment}
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

export default PurchaseManagement;
