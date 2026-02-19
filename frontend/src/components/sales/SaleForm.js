import React from 'react';
import { ValidationMessage, ValidationSummary } from '../../utils/formValidation';

/**
 * Form for adding/editing a sale
 */
function SaleForm({
    formState,
    onInputChange,
    onSubmit,
    onCancel,
    crops,
    customers,
    currentCrop,
    calculatedTotal,
    calculatedQtyKg,
    calculatedQtyUnit,
    validationErrors = {},  // New prop
    lastPriceHint = null,   // New prop
    isSubmitting = false    // Disable button during submission
}) {
    // Check if field has error
    const hasError = (field) => !!validationErrors[field];
    const getFieldClass = (field) => `block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-200 ${hasError(field) ? 'border-red-300 dark:border-red-800 text-red-900 dark:text-red-400 bg-white dark:bg-slate-800 placeholder-red-300 dark:placeholder-red-900/50 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800'}`;
    const getSelectClass = (field) => `block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-200 ${hasError(field) ? 'border-red-300 dark:border-red-800 text-red-900 dark:text-red-400 bg-white dark:bg-slate-800 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-800'}`;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 mb-6 overflow-hidden animate-fade-in transition-colors">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                <h5 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center me-3">
                        <i className="bi bi-cart-plus text-lg"></i>
                    </div>
                    عملية بيع جديدة
                </h5>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                    <i className="bi bi-x-lg"></i>
                </button>
            </div>
            <div className="p-6">
                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Basic Info Section */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المحصول <span className="text-red-500">*</span></label>
                            <select
                                className={getSelectClass('crop_id')}
                                name="crop_id"
                                value={formState.crop_id}
                                onChange={onInputChange}
                                required
                            >
                                <option value="">اختر المحصول</option>
                                {crops.map(crop => (
                                    <option key={crop.crop_id} value={crop.crop_id}>
                                        {crop.crop_name}
                                    </option>
                                ))}
                            </select>
                            <ValidationMessage error={validationErrors.crop_id} />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">العميل <span className="text-red-500">*</span></label>
                            <select
                                className={getSelectClass('customer_id')}
                                name="customer_id"
                                value={formState.customer_id}
                                onChange={onInputChange}
                                required
                            >
                                <option value="">اختر العميل</option>
                                {customers.map(customer => (
                                    <option key={customer.contact_id} value={customer.contact_id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                            <ValidationMessage error={validationErrors.customer_id} />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تاريخ البيع <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                className={getFieldClass('sale_date')}
                                name="sale_date"
                                value={formState.sale_date}
                                onChange={onInputChange}
                                required
                            />
                            <ValidationMessage error={validationErrors.sale_date} />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وحدة التسعير</label>
                            <select
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 transition-colors"
                                name="selling_pricing_unit"
                                value={formState.selling_pricing_unit}
                                onChange={onInputChange}
                                disabled={!currentCrop}
                            >
                                <option value="kg">كيلوجرام (kg)</option>
                                {currentCrop?.allowed_pricing_units?.map((unit, idx) => (
                                    <option key={idx} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">عامل التحويل</label>
                            <div className="px-3 py-2 bg-gray-100 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-md text-gray-600 dark:text-gray-300 text-sm transition-colors">
                                {formState.specific_selling_factor} كجم / {formState.selling_pricing_unit}
                            </div>
                        </div>

                        {/* Spacer for grid alignment */}
                        <div className="hidden lg:block"></div>

                        {/* Complex Crop Fields Section */}
                        {currentCrop?.is_complex_unit && (
                            <div className="col-span-full bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200 dark:border-amber-900/30 space-y-4 transition-colors">
                                <div className="flex items-center text-amber-800 dark:text-amber-400 mb-2">
                                    <i className="bi bi-gear-fill me-2"></i>
                                    <span className="text-sm font-medium">
                                        <strong>حسابات محصول مركب:</strong> يتم حساب الوزن الصافي تلقائياً (الوزن القائم - العيار).
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوزن القائم (كجم)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={getFieldClass('gross_quantity')}
                                            name="gross_quantity"
                                            value={formState.gross_quantity}
                                            onChange={onInputChange}
                                            placeholder="0.00"
                                        />
                                        <ValidationMessage error={validationErrors.gross_quantity} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">عدد العبوات/الأكياس</label>
                                        <input
                                            type="number"
                                            className={getFieldClass('bag_count')}
                                            name="bag_count"
                                            value={formState.bag_count}
                                            onChange={onInputChange}
                                            placeholder="0"
                                        />
                                        <ValidationMessage error={validationErrors.bag_count} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">إجمالي العيار (فارغ)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={getFieldClass('tare_weight')}
                                            name="tare_weight"
                                            value={formState.tare_weight}
                                            onChange={onInputChange}
                                            placeholder="0.00"
                                        />
                                        <ValidationMessage error={validationErrors.tare_weight} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="col-span-full"><hr className="border-gray-100" /></div>

                        {/* Quantity and Price Section */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {currentCrop?.is_complex_unit ? 'الوزن الصافي (كجم)' : 'الوزن (كجم)'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className={`${getFieldClass('quantity_input')} ${currentCrop?.is_complex_unit ? 'bg-gray-100 dark:bg-slate-700 font-bold' : ''}`}
                                name="quantity_input"
                                value={formState.quantity_input}
                                onChange={onInputChange}
                                placeholder="0.00"
                                required
                                readOnly={currentCrop?.is_complex_unit}
                            />
                            <ValidationMessage error={validationErrors.quantity_input} />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">الكمية بالوحدة</label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-md text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors">
                                {(calculatedQtyUnit || 0).toFixed(2)} {formState.selling_pricing_unit}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">السعر (لكل {formState.selling_pricing_unit}) <span className="text-red-500">*</span></label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">ج.م</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`${getFieldClass('price_input')} pl-12`}
                                    name="price_input"
                                    value={formState.price_input}
                                    onChange={onInputChange}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            {lastPriceHint && (
                                <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center"
                                    onClick={() => onInputChange({ target: { name: 'price_input', value: lastPriceHint.price } })}
                                    title="اضغط لاستخدام هذا السعر">
                                    <i className="bi bi-clock-history me-1"></i>
                                    آخر سعر: <strong>{lastPriceHint.price}</strong> ({lastPriceHint.date})
                                </div>
                            )}
                            <ValidationMessage error={validationErrors.price_input} />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ المستلم (ج.م)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">ج.م</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="block w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-colors"
                                    name="amount_received"
                                    value={formState.amount_received}
                                    onChange={onInputChange}
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">اتركه فارغاً للبيع الآجل بالكامل</p>
                        </div>

                        {/* Enhanced Pre-Save Summary Card */}
                        <div className="col-span-full mt-2">
                            <div className="rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-900 text-white transition-all">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="bg-white/20 dark:bg-black/20 p-3 rounded-lg me-4">
                                            <i className="bi bi-receipt text-2xl"></i>
                                        </div>
                                        <div className="flex-grow">
                                            <h6 className="text-emerald-100 dark:text-emerald-300 text-sm font-medium mb-1">ملخص العملية قبل الحفظ</h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                                                <div>
                                                    <small className="text-emerald-200 dark:text-emerald-400 block text-xs">الوزن الصافي</small>
                                                    <div className="text-xl font-bold">{calculatedQtyKg.toLocaleString('en-US')} كجم</div>
                                                </div>
                                                <div>
                                                    <small className="text-emerald-200 dark:text-emerald-400 block text-xs">الكمية بالوحدة</small>
                                                    <div className="text-xl font-bold">
                                                        {(calculatedQtyUnit || 0).toFixed(2)} {formState.selling_pricing_unit}
                                                    </div>
                                                </div>
                                                <div className="sm:border-r sm:border-emerald-500/30 dark:sm:border-emerald-400/20 sm:pr-4">
                                                    <small className="text-emerald-200 dark:text-emerald-400 block text-xs">الإجمالي المتوقع</small>
                                                    <div className="text-2xl font-bold">
                                                        {calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        <span className="text-sm font-normal ms-1">ج.م</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                            onClick={onCancel}
                        >
                            <i className="bi bi-x-lg ml-2"></i>
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2.5 border border-transparent text-white text-sm font-medium rounded-lg shadow-sm transition-all ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="bi bi-arrow-repeat animate-spin ml-2"></i>
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-lg ml-2"></i>
                                    حفظ العملية
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SaleForm;
