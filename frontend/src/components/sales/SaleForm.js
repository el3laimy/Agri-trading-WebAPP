import React from 'react';

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
    calculatedQtyUnit
}) {
    return (
        <div className="card border-0 shadow-sm mb-4 fade-in">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                    <i className="bi bi-plus-circle me-2"></i>
                    عملية بيع جديدة
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
                            <label className="form-label fw-bold">العميل</label>
                            <select
                                className="form-select"
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
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">تاريخ البيع</label>
                            <input
                                type="date"
                                className="form-control"
                                name="sale_date"
                                value={formState.sale_date}
                                onChange={onInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">وحدة التسعير</label>
                            <select
                                className="form-select"
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
                            <label className="form-label text-muted">الكمية بالوحدة</label>
                            <input
                                type="text"
                                className="form-control bg-light"
                                value={`${(calculatedQtyUnit || 0).toFixed(2)} ${formState.selling_pricing_unit}`}
                                readOnly
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
                                onChange={onInputChange}
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
                                onChange={onInputChange}
                                placeholder="0.00"
                            />
                            <div className="form-text">اتركه فارغاً للبيع الآجل بالكامل</div>
                        </div>
                        <div className="col-12">
                            <div className="alert alert-info d-flex align-items-center">
                                <i className="bi bi-calculator me-2 fs-5"></i>
                                <div>
                                    <strong>تفاصيل العملية:</strong><br />
                                    الوزن الصافي: {calculatedQtyKg.toFixed(2)} كجم<br />
                                    الكمية بالوحدة: {(calculatedQtyUnit || 0).toFixed(2)} {formState.selling_pricing_unit}<br />
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

export default SaleForm;
