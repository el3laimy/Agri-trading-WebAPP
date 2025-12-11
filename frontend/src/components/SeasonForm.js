import React, { useState, useEffect } from 'react';
import { createSeason, updateSeason } from '../api/seasons';

const SeasonForm = ({ season, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        status: 'UPCOMING'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (season) {
            setFormData({
                name: season.name,
                start_date: season.start_date,
                end_date: season.end_date,
                status: season.status
            });
        }
    }, [season]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (season) {
                await updateSeason(season.season_id, formData);
            } else {
                await createSeason(formData);
            }
            onClose(true); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.detail || 'فشل في حفظ الموسم');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card mb-3">
            <div className="card-header">
                <h5>{season ? 'تعديل موسم' : 'إضافة موسم جديد'}</h5>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">اسم الموسم</label>
                        <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">تاريخ البداية</label>
                            <input
                                type="date"
                                className="form-control"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">تاريخ النهاية</label>
                            <input
                                type="date"
                                className="form-control"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">الحالة</label>
                        <select
                            className="form-select"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="UPCOMING">قادم</option>
                            <option value="ACTIVE">نشط</option>
                            <option value="COMPLETED">مكتمل</option>
                        </select>
                    </div>

                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onClose(false)}
                            disabled={loading}
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SeasonForm;
