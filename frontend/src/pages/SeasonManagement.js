import React, { useState, useEffect } from 'react';
import { getSeasons, deleteSeason } from '../api/seasons';
import SeasonForm from '../components/SeasonForm';

const SeasonManagement = () => {
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [seasonToDelete, setSeasonToDelete] = useState(null);

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        try {
            setLoading(true);
            const data = await getSeasons();
            setSeasons(data);
            setError(null);
        } catch (err) {
            setError('فشل في تحميل المواسم');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedSeason(null);
        setShowForm(true);
    };

    const handleEdit = (season) => {
        setSelectedSeason(season);
        setShowForm(true);
    };

    const handleDeleteClick = (season) => {
        setSeasonToDelete(season);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!seasonToDelete) return;

        try {
            await deleteSeason(seasonToDelete.season_id);
            fetchSeasons();
            setShowDeleteModal(false);
            setSeasonToDelete(null);
        } catch (err) {
            alert('فشل في حذف الموسم');
            console.error(err);
            setShowDeleteModal(false);
            setSeasonToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSeasonToDelete(null);
    };

    const handleFormClose = (shouldRefresh) => {
        setShowForm(false);
        setSelectedSeason(null);
        if (shouldRefresh) {
            fetchSeasons();
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'badge bg-success';
            case 'UPCOMING':
                return 'badge bg-primary';
            case 'COMPLETED':
                return 'badge bg-secondary';
            default:
                return 'badge bg-light';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'نشط';
            case 'UPCOMING':
                return 'قادم';
            case 'COMPLETED':
                return 'مكتمل';
            default:
                return status;
        }
    };

    const filteredSeasons = seasons.filter(season =>
        season.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">جاري التحميل...</span>
            </div>
        </div>
    );

    return (
        <div className="container-fluid">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    تأكيد الحذف
                                </h5>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3">
                                    هل أنت متأكد من حذف الموسم <strong>"{seasonToDelete?.name}"</strong>؟
                                </p>
                                <div className="alert alert-warning d-flex align-items-start">
                                    <i className="bi bi-exclamation-circle-fill me-2 fs-5"></i>
                                    <div>
                                        <strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cancelDelete}
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    إلغاء
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={confirmDelete}
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    حذف نهائياً
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>
                        <i className="bi bi-calendar-range me-2"></i>
                        إدارة المواسم
                    </h2>
                    <p className="text-muted">تتبع المواسم الزراعية وحالاتها</p>
                </div>
            </div>

            {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>}

            {showForm && (
                <SeasonForm
                    season={selectedSeason}
                    onClose={handleFormClose}
                />
            )}

            {/* Action Bar */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 search-box"
                            placeholder="بحث عن موسم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-start">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleAdd}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        إضافة موسم جديد
                    </button>
                </div>
            </div>

            {/* Seasons Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        قائمة المواسم ({filteredSeasons.length})
                    </h5>
                </div>
                <div className="card-body p-0">
                    {filteredSeasons.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <p className="text-muted">لا توجد مواسم مسجلة</p>
                            <button
                                className="btn btn-primary"
                                onClick={handleAdd}
                            >
                                <i className="bi bi-plus-lg me-2"></i>
                                إضافة أول موسم
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>اسم الموسم</th>
                                        <th>تاريخ البداية</th>
                                        <th>تاريخ النهاية</th>
                                        <th>الحالة</th>
                                        <th style={{ width: '150px' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSeasons.map((season) => (
                                        <tr key={season.season_id}>
                                            <td className="fw-bold">{season.name}</td>
                                            <td>{new Date(season.start_date).toLocaleDateString('ar-EG')}</td>
                                            <td>{new Date(season.end_date).toLocaleDateString('ar-EG')}</td>
                                            <td>
                                                <span className={getStatusBadgeClass(season.status)}>
                                                    {getStatusText(season.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleEdit(season)}
                                                        title="تعديل"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteClick(season)}
                                                        title="حذف"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeasonManagement;
