import React, { useState, useEffect } from 'react';
import { getInventory, getCropBatches } from '../api/inventory';
import { useAuth } from '../context/AuthContext';
import { FaChevronDown, FaChevronUp, FaBoxOpen } from 'react-icons/fa';

function InventoryView() {
    const { token } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCropId, setExpandedCropId] = useState(null);
    const [batches, setBatches] = useState({});
    const [loadingBatches, setLoadingBatches] = useState({});

    useEffect(() => {
        if (token) {
            fetchInventory();
        }
    }, [token]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await getInventory(token);
            setInventory(data);
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
        } finally {
            setLoading(false);
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
                } finally {
                    setLoadingBatches(prev => ({ ...prev, [cropId]: false }));
                }
            }
        }
    };

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border text-success"></div></div>;
    }

    return (
        <div className="container-fluid p-4 direction-rtl">
            <h2 className="mb-4 text-primary fw-bold flex items-center gap-2">
                <FaBoxOpen /> عرض المخزون
            </h2>
            <div className="card shadow-sm border-0 rounded-lg">
                <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold text-gray-700">أرصدة المخزون الحالية</h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4">المحصول</th>
                                    <th className="py-3">الكمية الحالية (كجم)</th>
                                    <th className="py-3">متوسط التكلفة (للكيلو)</th>
                                    <th className="py-3">القيمة الإجمالية</th>
                                    <th className="py-3">تفاصيل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => (
                                    <React.Fragment key={item.crop.crop_id}>
                                        <tr
                                            onClick={() => toggleRow(item.crop.crop_id)}
                                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className="px-4 fw-bold text-success">{item.crop.crop_name}</td>
                                            <td>
                                                <span className={`badge ${item.current_stock_kg <= (item.low_stock_threshold || 100) ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                    {item.current_stock_kg.toFixed(2)}
                                                </span>
                                            </td>
                                            <td>{item.average_cost_per_kg.toFixed(2)} ج.م</td>
                                            <td className="fw-bold text-gray-700">{(item.current_stock_kg * item.average_cost_per_kg).toFixed(2)} ج.م</td>
                                            <td>
                                                {expandedCropId === item.crop.crop_id ? <FaChevronUp /> : <FaChevronDown />}
                                            </td>
                                        </tr>
                                        {expandedCropId === item.crop.crop_id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="5" className="p-4">
                                                    <div className="bg-white rounded border p-3">
                                                        <h6 className="mb-3 fw-bold border-bottom pb-2">تفاصيل الدفعات (FIFO)</h6>
                                                        {loadingBatches[item.crop.crop_id] ? (
                                                            <div className="text-center text-muted">جاري تحميل الدفعات...</div>
                                                        ) : batches[item.crop.crop_id] && batches[item.crop.crop_id].length > 0 ? (
                                                            <table className="table table-sm table-bordered mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th>رقم الدفعة</th>
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
                                                                            <td>#{batch.batch_id}</td>
                                                                            <td>{batch.purchase_date}</td>
                                                                            <td>{batch.supplier_name}</td>
                                                                            <td className="fw-bold">{batch.quantity_kg} كجم</td>
                                                                            <td>{batch.cost_per_kg} ج.م</td>
                                                                            <td className={batch.expiry_date && new Date(batch.expiry_date) < new Date() ? 'text-danger' : ''}>
                                                                                {batch.expiry_date || '-'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : (
                                                            <div className="text-center text-muted">لا توجد دفعات نشطة (قد يكون رصيد افتتاحي قديم)</div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {inventory.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">لا يوجد مخزون حالياً</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InventoryView;
