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

// Import new components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';
import { SalesTrendChart, SalesByStatusChart, TopCropsChart, SalesStatsCards } from '../components/sales/charts/SalesCharts';

// Import CSS animations
import '../styles/dashboardAnimations.css';

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

    // Charts visibility toggle
    const [showCharts, setShowCharts] = useState(true);

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
            refetchSales();
        } catch (err) {
            console.error("Payment error:", err);
            showError(err.message);
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
        } catch (err) {
            console.error("Failed to delete sale:", err);
            showError(err.response?.data?.detail || "فشل في حذف عملية البيع");
        }
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

    // Calculate totals
    const calculatedQtyKg = parseFloat(formState.quantity_input || 0);
    const calculatedQtyUnit = calculatedQtyKg / parseFloat(formState.specific_selling_factor || 1);
    const calculatedTotal = calculatedQtyUnit * parseFloat(formState.price_input || 0);

    // Loading state
    if (isLoading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800/30 dark:to-teal-800/30" />
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
            {showPaymentForm && payingSale && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleCancelPayment}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-slate-700 animate-fade-in-scale">
                            <SalePaymentForm
                                sale={payingSale}
                                onSave={handleSavePayment}
                                onCancel={handleCancelPayment}
                            />
                        </div>
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
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 animate-fade-in">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fade-in">
                    {/* Trend Chart */}
                    <div className="lg:col-span-2 neumorphic p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <i className="bi bi-graph-up text-emerald-500" />
                            اتجاه المبيعات
                        </h3>
                        <SalesTrendChart sales={sales} />
                    </div>

                    {/* Status Chart */}
                    <div className="neumorphic p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
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
                <div className="mb-6 animate-fade-in">
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
                    />
                </div>
            )}

            {/* Sales Table */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-emerald-500" />
                        سجل المبيعات
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
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
