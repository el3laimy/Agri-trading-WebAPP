import React from 'react';
import { ValidationMessage, ValidationSummary } from '../../utils/formValidation';

/**
 * Form for adding/editing a purchase
 */
function PurchaseForm({
    formState,
    onInputChange,
    onSubmit,
    onCancel,
    crops,
    suppliers,
    currentCrop,
    calculatedTotal,
    calculatedQtyKg,
    calculatedQtyUnit,
    validationErrors = {},  // New prop for validation errors
    lastPriceHint = null    // New prop for last price suggestion
}) {
    // Check if field has error
    const hasError = (field) => !!validationErrors[field];
    const getFieldClass = (field) => hasError(field)
        ? 'block w-full pr-3 pl-10 py-2 text-base border-red-300 dark:border-red-800 text-red-900 dark:text-red-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md shadow-sm'
        : 'block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md shadow-sm transition-all duration-200';

    const getSelectClass = (field) => hasError(field)
        ? 'block w-full pr-3 pl-10 py-2 text-base border-red-300 dark:border-red-800 text-red-900 dark:text-red-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md shadow-sm'
        : 'block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md shadow-sm transition-all duration-200';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg animate-fade-in transition-colors text-right">
            <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">المحصول</label>
                        <div className="relative">
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
                        </div>
                        <ValidationMessage error={validationErrors.crop_id} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">المورد</label>
                        <div className="relative">
                            <select
                                className={getSelectClass('supplier_id')}
                                name="supplier_id"
                                value={formState.supplier_id}
                                onChange={onInputChange}
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
                        <ValidationMessage error={validationErrors.supplier_id} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">تاريخ الشراء</label>
                        <input
                            type="date"
                            className={getFieldClass('purchase_date')}
                            name="purchase_date"
                            value={formState.purchase_date}
                            onChange={onInputChange}
                            required
                        />
                        <ValidationMessage error={validationErrors.purchase_date} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">وحدة التسعير</label>
                        <select
                            className="block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md shadow-sm disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors"
                            name="purchasing_pricing_unit"
                            value={formState.purchasing_pricing_unit}
                            onChange={onInputChange}
                            disabled={!currentCrop}
                        >
                            <option value="kg">كيلوجرام (kg)</option>
                            {currentCrop?.allowed_pricing_units?.map((unit, idx) => (
                                <option key={idx} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors">عامل التحويل</label>
                        <input
                            type="text"
                            className="block w-full pr-3 pl-10 py-2 text-base border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 sm:text-sm rounded-md shadow-sm cursor-not-allowed transition-colors font-mono"
                            value={`${formState.conversion_factor} كجم / ${formState.purchasing_pricing_unit}`}
                            disabled
                        />
                    </div>

                    {/* Complex Crop Fields */}
                    {currentCrop?.is_complex_unit && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-lg p-4 space-y-4 transition-colors">
                            <div className="flex items-center text-amber-800 dark:text-amber-400 mb-2">
                                <i className="bi bi-gear-fill ml-2 text-amber-600 dark:text-amber-500"></i>
                                <span className="font-bold">حسابات محصول مركب:</span>
                                <span className="mr-1 text-sm">اختر صيغة الحساب وأدخل البيانات.</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">صيغة الحساب</label>
                                    <select
                                        className="block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md shadow-sm transition-colors"
                                        name="calculation_formula"
                                        value={formState.calculation_formula}
                                        onChange={onInputChange}
                                    >
                                        <option value="qantar_baladi">قنطار بلدي (160 كجم - بدون عيار)</option>
                                        <option value="qantar_government">قنطار حكومي (157.5 كجم - بعيار)</option>
                                        <option value="ton">طن (1000 كجم)</option>
                                        <option value="kg">كيلوجرام</option>
                                    </select>
                                    <div className="mt-1 text-xs">
                                        {formState.calculation_formula === 'qantar_baladi' &&
                                            <span className="text-amber-700 flex items-center">
                                                <i className="bi bi-info-circle ml-1"></i>
                                                البلدي: تُحسب الفاتورة بدون خصم العيار، لكن المخزن يستخدم عيار اعتباري.
                                            </span>
                                        }
                                        {formState.calculation_formula === 'qantar_government' &&
                                            <span className="text-emerald-700 flex items-center">
                                                <i className="bi bi-info-circle ml-1"></i>
                                                الحكومي: يُخصم العيار من الفاتورة والمخزن.
                                            </span>
                                        }
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">الوزن القائم (كجم)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md shadow-sm transition-colors"
                                        name="gross_quantity"
                                        value={formState.gross_quantity}
                                        onChange={onInputChange}
                                        placeholder="0.00"
                                    />
                                    <ValidationMessage error={validationErrors.gross_quantity} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">عدد الأكياس</label>
                                    <input
                                        type="number"
                                        className="block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md shadow-sm transition-colors"
                                        name="bag_count"
                                        value={formState.bag_count}
                                        onChange={onInputChange}
                                        placeholder="0"
                                    />
                                    <ValidationMessage error={validationErrors.bag_count} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">العيار/كيس (كجم)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md shadow-sm transition-colors"
                                        name="tare_per_bag"
                                        value={formState.tare_per_bag}
                                        onChange={onInputChange}
                                        placeholder={currentCrop?.default_tare_per_bag || '2'}
                                    />
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        اقتراح: {currentCrop?.default_tare_per_bag || 2} كجم
                                    </div>
                                    <ValidationMessage error={validationErrors.tare_per_bag} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">إجمالي العيار</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="block w-full pr-3 pl-10 py-2 text-base border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 sm:text-sm rounded-md shadow-sm transition-colors"
                                        name="tare_weight"
                                        value={formState.tare_weight}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                            {currentCrop?.is_complex_unit ? 'الوزن الصافي (كجم)' : 'الوزن (كجم)'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className={`${getFieldClass('quantity_input')} ${currentCrop?.is_complex_unit ? 'bg-gray-100 dark:bg-slate-800 font-bold' : ''} transition-colors`}
                            name="quantity_input"
                            value={formState.quantity_input}
                            onChange={onInputChange}
                            placeholder="0.00"
                            required
                            readOnly={currentCrop?.is_complex_unit}
                        />
                        <ValidationMessage error={validationErrors.quantity_input} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors">الكمية ({formState.purchasing_pricing_unit})</label>
                        <input
                            type="number"
                            className="block w-full pr-3 pl-10 py-2 text-base border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 sm:text-sm rounded-md shadow-sm cursor-not-allowed transition-colors"
                            value={calculatedQtyUnit ? calculatedQtyUnit.toFixed(2) : ''}
                            disabled
                            readOnly
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">السعر (لكل {formState.purchasing_pricing_unit})</label>
                        <input
                            type="number"
                            step="0.01"
                            className={getFieldClass('price_input')}
                            name="price_input"
                            value={formState.price_input}
                            onChange={onInputChange}
                            placeholder="0.00"
                        />
                        {lastPriceHint && (
                            <div className="mt-1 text-xs text-emerald-600 flex items-center cursor-pointer hover:text-emerald-700"
                                onClick={() => onInputChange({ target: { name: 'price_input', value: lastPriceHint.price } })}
                                title="اضغط لاستخدام هذا السعر">
                                <i className="bi bi-clock-history ml-1"></i>
                                آخر سعر: <strong>{lastPriceHint.price}</strong> ({lastPriceHint.date})
                            </div>
                        )}
                        <ValidationMessage error={validationErrors.price_input} />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">المبلغ المدفوع (ج.م)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="block w-full pr-3 pl-10 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md shadow-sm transition-colors"
                            name="amount_paid"
                            value={formState.amount_paid}
                            onChange={onInputChange}
                            placeholder="0.00"
                        />
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">اتركه فارغاً للشراء الآجل بالكامل</div>
                        <ValidationMessage error={validationErrors.amount_paid} />
                    </div>

                    {/* Enhanced Pre-Save Summary Card */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-950 text-white transition-all">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-white/20 dark:bg-black/20 p-3 rounded-full">
                                        <i className="bi bi-receipt text-2xl text-white"></i>
                                    </div>
                                    <div className="mr-4 flex-1">
                                        <h6 className="text-indigo-100 dark:text-indigo-300 text-sm font-medium mb-1 uppercase tracking-wider">ملخص العملية قبل الحفظ</h6>
                                        <div className="flex flex-wrap gap-6 mt-3 text-right" dir="rtl">
                                            <div>
                                                <small className="text-indigo-200 dark:text-indigo-400 block text-xs">الوزن الصافي</small>
                                                <div className="text-lg font-bold">{calculatedQtyKg.toLocaleString('en-US')} كجم</div>
                                            </div>
                                            <div>
                                                <small className="text-indigo-200 dark:text-indigo-400 block text-xs">الكمية بالوحدة</small>
                                                <div className="text-lg font-bold">
                                                    {calculatedQtyUnit ? calculatedQtyUnit.toFixed(2) : 0} {formState.purchasing_pricing_unit}
                                                </div>
                                            </div>
                                            <div className="border-r border-indigo-400/30 pr-6 mr-2">
                                                <small className="text-indigo-200 dark:text-indigo-400 block text-xs">التكلفة الإجمالية</small>
                                                <div className="text-2xl font-bold">
                                                    {calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    <small className="font-normal text-sm opacity-80 mr-1">ج.م</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800 pt-6 transition-colors">
                    <button
                        type="button"
                        className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-sm"
                        onClick={onCancel}
                    >
                        <i className="bi bi-x-lg ml-2"></i>
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2.5 bg-emerald-600 dark:bg-emerald-500 border border-transparent text-white text-sm font-bold rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md transition-all transform hover:scale-[1.02]"
                    >
                        <i className="bi bi-check-lg ml-2"></i>
                        حفظ العملية
                    </button>
                </div>
            </form>
        </div>
    );
}

export default PurchaseForm;
