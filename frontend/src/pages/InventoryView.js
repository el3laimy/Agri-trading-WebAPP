import React, { useState, useEffect } from 'react';
import { getInventory, getCropBatches } from '../api/inventory';
import { useAuth } from '../context/AuthContext';
import { usePageState } from '../hooks';
import { PageHeader, PageLoading, AlertToast, Card } from '../components/common';
import { formatCurrency } from '../utils';

function InventoryView() {
    const { token } = useAuth();

    // Shared Hooks
    const {
        isLoading,
        startLoading,
        stopLoading,
        error,
        showError,
        clearMessages
    } = usePageState();

    const [inventory, setInventory] = useState([]);
    const [expandedCropId, setExpandedCropId] = useState(null);
    const [batches, setBatches] = useState({});
    const [loadingBatches, setLoadingBatches] = useState({});

    useEffect(() => {
        if (token) {
            fetchInventory();
        }
    }, [token]);

    const fetchInventory = async () => {
        startLoading();
        try {
            const data = await getInventory(token);
            setInventory(data);
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
            showError("فشل تحميل بيانات المخزون");
        } finally {
            stopLoading();
        }
    };

    const toggleRow = async (cropId) => {
        if (expandedCropId === cropId) {
            setExpandedCropId(null);
        } else {
            setExpandedCropId(cropId);
            if (!batches[cropId]) {
                setLoadingBatches(prev => ({ ...prev, [cropId]: true }));
                try {
                    const data = await getCropBatches(token, cropId);
                    setBatches(prev => ({ ...prev, [cropId]: data }));
                } catch (err) {
                    console.error("Failed to fetch batches", err);
                    showError("فشل تحميل تفاصيل الدفعات");
                } finally {
                    setLoadingBatches(prev => ({ ...prev, [cropId]: false }));
                }
            }
        }
    };

    return (
        <div className="container-fluid">
            <PageHeader
                title="عرض المخزون"
                subtitle="مراقبة أرصدة المحاصيل وتفاصيل الدفعات (FIFO) وتواريخ الصلاحية"
                icon="bi-box-seam"
            />

            {error && <AlertToast message={error} type="error" onClose={clearMessages} />}

            {isLoading && !inventory.length ? (
                <PageLoading text="جاري جرد المخزون..." />
            ) : (
                <Card className="border-0 shadow-lg">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="py-3 px-4">المحصول</th>
                                    <th className="py-3 text-center">الكمية الحالية</th>
                                    <th className="py-3 text-center">متوسط التكلفة</th>
                                    <th className="py-3 text-center">القيمة الإجمالية</th>
                                    <th className="py-3 text-center" style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => (
                                    <React.Fragment key={item.crop.crop_id}>
                                        <tr
                                            onClick={() => toggleRow(item.crop.crop_id)}
                                            className={`cursor-pointer transition-colors ${expandedCropId === item.crop.crop_id ? 'bg-light' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className="px-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                                                        <i className="bi bi-flower1 text-success"></i>
                                                    </div>
                                                    <strong>{item.crop.crop_name}</strong>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${item.current_stock_kg <= (item.low_stock_threshold || 100) ? 'bg-warning text-dark' : 'bg-primary-subtle text-primary'} fs-6 fw-normal px-3`}>
                                                    {item.current_stock_kg.toFixed(2)} كجم
                                                </span>
                                                {item.current_stock_kg <= (item.low_stock_threshold || 100) && (
                                                    <div className="text-warning small mt-1">
                                                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                                        مخزون منخفض
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-center text-muted fw-bold">
                                                {formatCurrency(item.average_cost_per_kg)} <small className="fw-normal">/كجم</small>
                                            </td>
                                            <td className="text-center fw-bold text-success">
                                                {formatCurrency(item.current_stock_kg * item.average_cost_per_kg)}
                                            </td>
                                            <td className="text-center text-muted">
                                                <i className={`bi bi-chevron-${expandedCropId === item.crop.crop_id ? 'up' : 'down'}`}></i>
                                            </td>
                                        </tr>
                                        {expandedCropId === item.crop.crop_id && (
                                            <tr className="bg-light">
                                                <td colSpan="5" className="p-4 border-start border-4 border-success">
                                                    <div className="bg-white rounded border shadow-sm p-3">
                                                        <h6 className="mb-3 fw-bold text-success border-bottom pb-2">
                                                            <i className="bi bi-layers me-2"></i>
                                                            تفاصيل الدفعات (نظام FIFO)
                                                        </h6>

                                                        {loadingBatches[item.crop.crop_id] ? (
                                                            <div className="text-center py-3">
                                                                <div className="spinner-border spinner-border-sm text-success mb-2" role="status"></div>
                                                                <div className="small text-muted">جاري تحميل البيانات...</div>
                                                            </div>
                                                        ) : batches[item.crop.crop_id] && batches[item.crop.crop_id].length > 0 ? (
                                                            <table className="table table-sm table-bordered mb-0">
                                                                <thead className="table-light small text-muted">
                                                                    <tr>
                                                                        <th>الدفعة #</th>
                                                                        <th>تاريخ الشراء</th>
                                                                        <th>المورد</th>
                                                                        <th>الكمية المتبقية</th>
                                                                        <th>التكلفة (كجم)</th>
                                                                        <th>الصلاحية</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {batches[item.crop.crop_id].map(batch => (
                                                                        <tr key={batch.batch_id}>
                                                                            <td className="text-muted small">#{batch.batch_id}</td>
                                                                            <td>{batch.purchase_date}</td>
                                                                            <td>{batch.supplier_name}</td>
                                                                            <td className="fw-bold text-dark">{batch.quantity_kg} كجم</td>
                                                                            <td>{formatCurrency(batch.cost_per_kg)}</td>
                                                                            <td className={batch.expiry_date && new Date(batch.expiry_date) < new Date() ? 'text-danger fw-bold' : ''}>
                                                                                {batch.expiry_date ? (
                                                                                    <>
                                                                                        {batch.expiry_date}
                                                                                        {new Date(batch.expiry_date) < new Date() && <i className="bi bi-exclamation-circle-fill ms-1" title="منتهية الصلاحية"></i>}
                                                                                    </>
                                                                                ) : (
                                                                                    <span className="text-muted">-</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <div className="text-center text-muted py-3 border rounded bg-white">
                                                                <i className="bi bi-info-circle mb-2 d-block fs-5"></i>
                                                                لا توجد تفاصيل دفعات متاحة لهذا المحصول (رصيد افتتاحي)
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {inventory.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <i className="bi bi-box2 text-muted mb-3 d-block" style={{ fontSize: '3rem' }}></i>
                                            <p className="text-muted">لا يوجد مخزون مسجل حالياً</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default InventoryView;
