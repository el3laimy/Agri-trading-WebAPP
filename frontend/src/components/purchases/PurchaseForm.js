import React from 'react';

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
    calculatedQtyUnit
}) {
    return (
        <div className="card border-0 shadow-sm mb-4 fade-in">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                    <i className="bi bi-plus-circle me-2"></i>
                    عملية شراء جديدة
                </h5>
            </div>
            <div className="card-body">
                <form onSubmit={onSubmit}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">المحصول</label>
                            <select
                                className="form-select"
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
                        <div className="col-md-6">
                            <label className="form-label fw-bold">المورد</label>
                            <select
                                className="form-select"
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
                        <div className="col-md-4">
                            <label className="form-label fw-bold">تاريخ الشراء</label>
                            <input
                                type="date"
                                className="form-control"
                                name="purchase_date"
                                value={formState.purchase_date}
                                onChange={onInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">وحدة التسعير</label>
                            <select
                                className="form-select"
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
                        <div className="col-md-4">
                            <label className="form-label text-muted">عامل التحويل</label>
                            <input
                                type="text"
                                className="form-control"
                                value={`${formState.conversion_factor} كجم / ${formState.purchasing_pricing_unit}`}
                                disabled
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-bold">الوزن (كجم)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                name="quantity_input"
                                value={formState.quantity_input}
                                onChange={onInputChange}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label text-muted">الكمية ({formState.purchasing_pricing_unit})</label>
                            <input
                                type="number"
                                className="form-control bg-light"
                                value={calculatedQtyUnit ? calculatedQtyUnit.toFixed(2) : ''}
                                disabled
                                readOnly
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">السعر ({formState.purchasing_pricing_unit})</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                name="price_input"
                                value={formState.price_input}
                                onChange={onInputChange}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">المبلغ المدفوع (ج.م)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                name="amount_paid"
                                value={formState.amount_paid}
                                onChange={onInputChange}
                                placeholder="0.00"
                            />
                            <div className="form-text">اتركه فارغاً للشراء الآجل بالكامل</div>
                        </div>
                        <div className="col-12">
                            <div className="alert alert-info d-flex align-items-center">
                                <i className="bi bi-calculator me-2 fs-5"></i>
                                <div>
                                    <strong>تفاصيل العملية:</strong><br />
                                    الوزن الصافي: {calculatedQtyKg.toFixed(2)} كجم<br />
                                    الكمية بالوحدة: {calculatedQtyUnit ? calculatedQtyUnit.toFixed(2) : 0} {formState.purchasing_pricing_unit}<br />
                                    التكلفة الإجمالية: {calculatedTotal.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
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
                            onClick={onCancel}
                        >
                            <i className="bi bi-x-lg me-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PurchaseForm;
