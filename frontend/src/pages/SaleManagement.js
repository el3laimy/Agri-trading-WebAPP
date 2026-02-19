import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getLastSalePrice } from '../api/sales';
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from '../hooks/useSales';
import { useCrops, useCustomers } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import SalePaymentForm from '../components/SalePaymentForm';
import { EmptySales, EmptySearch } from '../components/EmptyState';
import { SaleForm, SalesTable, CropFilterTabs } from '../components/sales';
import { validateSaleForm } from '../utils/formValidation';
import { useToast, ConfirmationModal } from '../components/common';

// Import shared utilities and components
import { usePageState, useDebounce } from '../hooks';
import { formatPhoneForWhatsApp, handleApiError, VALIDATION_MESSAGES } from '../utils';
import { safeParseFloat, safeParseInt } from '../utils/mathUtils';

// Import new components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';
import { ManagementPageSkeleton } from '../components/common';
import { SalesTrendChart, SalesByStatusChart, TopCropsChart, SalesStatsCards } from '../components/sales/charts/SalesCharts';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

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
    gross_quantity: '',
    bag_count: '',
    tare_weight: '',
    calculation_formula: ''
});

function SaleManagement() {
    const { data: crops = [], isLoading: cropsLoading } = useCrops();
    const { data: customers = [], isLoading: customersLoading } = useCustomers();
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

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Charts visibility toggle
    const [showCharts, setShowCharts] = useState(true);

    // Use shared page state hook
    const { error, showError, clearError } = usePageState();

    // Payment modal state
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [payingSale, setPayingSale] = useState(null);

    // Delete confirmation modal state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingSale, setDeletingSale] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

                    if (!formState.price_input) {
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
            let updates = { [name]: value };

            if (currentCrop?.is_complex_unit) {
                let newGross = name === 'gross_quantity' ? parseFloat(value) || 0 : parseFloat(formState.gross_quantity) || 0;
                let newBags = name === 'bag_count' ? parseFloat(value) || 0 : parseFloat(formState.bag_count) || 0;
                let newTare = name === 'tare_weight' ? parseFloat(value) || 0 : parseFloat(formState.tare_weight) || 0;

                if (name === 'bag_count' && currentCrop.default_tare_per_bag) {
                    newTare = newBags * currentCrop.default_tare_per_bag;
                    updates.tare_weight = newTare;
                }

                if (name === 'gross_quantity' || name === 'bag_count' || name === 'tare_weight') {
                    const netWeight = Math.max(0, newGross - newTare);
                    updates.quantity_input = netWeight;
                }
            }

            setFormState(prev => ({ ...prev, ...updates }));
        }
    }, [crops, currentCrop, formState, validationErrors]);

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        const validation = validateSaleForm(formState, currentCrop);
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            showError("يرجى تصحيح الأخطاء في النموذج");
            return;
        }

        try {
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
            setFormState(getInitialFormState());
            setCurrentCrop(null);
            setShowAddForm(false);
            clearError();
            setValidationErrors({});
            setLastPriceHint(null);
        } catch (err) {
            console.error("Failed to create sale:", err);
            showError(handleApiError(err, 'sale_create'));
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
            const apiClient = (await import('../api/client')).default;
            await apiClient.post('/payments/', paymentData);
            handleCancelPayment();
            refetchSales();
        } catch (err) {
            console.error("Payment error:", err);
            showError(handleApiError(err, 'sale_payment'));
        }
    };

    // Share handlers
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
            const apiClient = (await import('../api/client')).default;
            await apiClient.post(`/sales/${sale.sale_id}/share/email`, { email });
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
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Delete handler - opens confirmation modal
    const handleDelete = (sale) => {
        setDeletingSale(sale);
        setShowDeleteConfirm(true);
    };

    // Confirm delete - executes after user confirms
    const confirmDelete = async () => {
        if (!deletingSale) return;
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(deletingSale.sale_id);
            // Success message is usually handled by the mutation onSuccess, 
            // but we can add an explicit one here if not covered there.
            // Assuming deleteMutation uses standard hooks that might generic toasts, 
            // but let's be explicit as requested.
            showSuccess('تم حذف عملية البيع بنجاح');

            setShowDeleteConfirm(false);
            setDeletingSale(null);
        } catch (err) {
            console.error("Failed to delete sale:", err);
            // Explicit Error Message
            const reason = err.response?.data?.detail || 'حدث خطأ غير متوقع أثناء الحذف';
            showError(`فشل حذف عملية البيع: ${reason}`);
        } finally {
            setIsDeleting(false);
        }
    };

    // Cancel delete
    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setDeletingSale(null);
    };

    // Status badge
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
            setSelectedCropFilter('all');
        }
    }, [uniqueCrops, sales.length, selectedCropFilter]);

    // Filter sales
    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchesSearch = (
                sale.customer?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                sale.crop?.crop_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                sale.sale_id?.toString().includes(debouncedSearchTerm)
            );
            const matchesCrop = selectedCropFilter === 'all' || selectedCropFilter === null
                ? true
                : sale.crop?.crop_id === selectedCropFilter;
            return matchesSearch && matchesCrop;
        });
    }, [sales, debouncedSearchTerm, selectedCropFilter]);

    // Calculate totals - SAFE PARSING
    const calculatedQtyKg = safeParseFloat(formState.quantity_input);
    const calculatedQtyUnit = calculatedQtyKg / safeParseFloat(formState.specific_selling_factor, 1);
    const calculatedTotal = calculatedQtyUnit * safeParseFloat(formState.price_input);

    // Loading state
    if (isLoading) {
        return <ManagementPageSkeleton showStats={true} showFilters={true} tableRows={8} tableColumns={8} />;
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                title="تأكيد حذف عملية البيع"
                message={`هل أنت متأكد من حذف عملية البيع رقم ${deletingSale?.sale_id}؟ لا يمكن التراجع عن هذا الإجراء.`}
                confirmText="حذف"
                cancelText="إلغاء"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Payment Form Modal */}
            {showPaymentForm && payingSale && (
                <div className="lg-modal-overlay" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="lg-modal" style={{ maxWidth: '520px' }}>
                        <SalePaymentForm
                            sale={payingSale}
                            onSave={handleSavePayment}
                            onCancel={handleCancelPayment}
                        />
                    </div>
                </div>
            )}

            {/* Page Header with Stats */}
            <PageHeader
                title="إدارة المبيعات"
                subtitle="إدارة وتتبع جميع عمليات البيع والتحصيلات"
                icon="bi-cart-check"
                gradient="from-emerald-500 to-teal-500"
                actions={
                    <>
                        <button
                            onClick={() => setShowCharts(!showCharts)}
                            className={`p-3 rounded-xl transition-all ${showCharts ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70'}`}
                            title="إظهار/إخفاء الرسوم البيانية"
                        >
                            <i className="bi bi-graph-up" />
                        </button>
                        {hasPermission('sales:write') && (
                            <ActionButton
                                label={showAddForm ? 'إلغاء' : 'إضافة عملية بيع'}
                                icon={showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}
                                onClick={() => setShowAddForm(!showAddForm)}
                                variant={showAddForm ? 'danger' : 'primary'}
                            />
                        )}
                    </>
                }
            >
                {/* Stats Cards */}
                <SalesStatsCards sales={sales} />
            </PageHeader>

            {/* Error Alert */}
            {error && (
                <div className="mb-6 p-4 rounded-xl border-2 border-red-200 dark:border-red-800 lg-animate-fade" style={{ background: 'var(--lg-glass-bg)' }}>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <i className="bi bi-exclamation-triangle-fill text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-red-700 dark:text-red-400">خطأ في النظام</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                        </div>
                        <button onClick={clearError} className="text-red-400 hover:text-red-600 p-1">
                            <i className="bi bi-x-lg" />
                        </button>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {showCharts && sales.length > 0 && !showAddForm && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 lg-animate-fade">
                    {/* Trend Chart */}
                    <div className="lg:col-span-2 lg-card p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                            <i className="bi bi-graph-up text-emerald-500" />
                            اتجاه المبيعات
                        </h3>
                        <SalesTrendChart sales={sales} />
                    </div>

                    {/* Status Chart */}
                    <div className="lg-card p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                            <i className="bi bi-pie-chart text-blue-500" />
                            حالة الدفع
                        </h3>
                        <SalesByStatusChart sales={sales} />
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث بالعميل، المحصول أو رقم العملية..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Crop Filter Chips */}
            {!showAddForm && uniqueCrops.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <FilterChip
                        label="الكل"
                        count={sales.length}
                        icon="bi-grid"
                        active={selectedCropFilter === 'all'}
                        onClick={() => setSelectedCropFilter('all')}
                    />
                    {uniqueCrops.map(({ crop, count }) => (
                        <FilterChip
                            key={crop.crop_id}
                            label={crop.crop_name}
                            count={count}
                            icon="bi-flower1"
                            active={selectedCropFilter === crop.crop_id}
                            onClick={() => setSelectedCropFilter(crop.crop_id)}
                            color="emerald"
                        />
                    ))}
                </div>
            )}

            {/* Add Sale Form */}
            {showAddForm && (
                <div className="mb-6 lg-animate-fade">
                    <SaleForm
                        formState={formState}
                        onInputChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onCancel={() => { setShowAddForm(false); setEditingSale(null); }}
                        crops={crops}
                        customers={customers}
                        currentCrop={currentCrop}
                        calculatedTotal={calculatedTotal}
                        calculatedQtyKg={calculatedQtyKg}
                        calculatedQtyUnit={calculatedQtyUnit}
                        validationErrors={validationErrors}
                        lastPriceHint={lastPriceHint}
                        isSubmitting={createMutation.isPending || updateMutation.isPending}
                    />
                </div>
            )}

            {/* Sales Table */}
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-list-ul text-emerald-500" />
                        سجل المبيعات
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: 'rgb(5,150,105)' }}>
                            {filteredSales.length}
                        </span>
                    </h5>

                    {/* Top Crops Mini Chart (Desktop only) */}
                    {sales.length > 0 && (
                        <div className="hidden lg:block w-64">
                            <TopCropsChart sales={sales} />
                        </div>
                    )}
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
