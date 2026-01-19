import React, { useState, useEffect, useMemo } from 'react';
import { getSeasons, deleteSeason } from '../api/seasons';
import SeasonForm from '../components/SeasonForm';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

const SeasonManagement = () => {
    const { showSuccess, showError } = useToast();
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
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
        } catch (err) {
            console.error('Failed to fetch seasons:', err);
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const active = seasons.filter(s => s.status === 'ACTIVE').length;
        const upcoming = seasons.filter(s => s.status === 'UPCOMING').length;
        const completed = seasons.filter(s => s.status === 'COMPLETED').length;
        return { total: seasons.length, active, upcoming, completed };
    }, [seasons]);

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
            showSuccess('تم حذف الموسم بنجاح');
        } catch (err) {
            showError('فشل في حذف الموسم');
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
            showSuccess(selectedSeason ? 'تم تحديث الموسم' : 'تم إضافة الموسم');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return { className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', text: 'نشط', icon: 'bi-play-circle' };
            case 'UPCOMING':
                return { className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', text: 'قادم', icon: 'bi-clock' };
            case 'COMPLETED':
                return { className: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400', text: 'مكتمل', icon: 'bi-check-circle' };
            default:
                return { className: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400', text: status, icon: 'bi-question-circle' };
        }
    };

    // Filter seasons
    const filteredSeasons = useMemo(() => {
        return seasons.filter(season => {
            const matchesSearch = season.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter === 'all' ? true : season.status === selectedFilter;
            return matchesSearch && matchesFilter;
        });
    }, [seasons, searchTerm, selectedFilter]);

    if (loading) {
        return (
            <div className="p-6 max-w-full mx-auto">
                <div className="neumorphic overflow-hidden mb-6 animate-pulse">
                    <div className="h-40 bg-gradient-to-br from-cyan-200 to-teal-200 dark:from-cyan-800/30 dark:to-teal-800/30" />
                </div>
                <div className="neumorphic p-6">
                    <LoadingCard rows={5} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete} />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-scale">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-bounce-in">
                                    <i className="bi bi-exclamation-triangle text-3xl text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">تأكيد الحذف</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    هل أنت متأكد من حذف <span className="font-bold text-gray-800 dark:text-gray-200">"{seasonToDelete?.name}"</span>؟
                                </p>
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button onClick={cancelDelete} className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">
                                    إلغاء
                                </button>
                                <button onClick={confirmDelete} className="px-6 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all hover-scale">
                                    حذف نهائياً
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Season Form Modal */}
            {showForm && (
                <SeasonForm season={selectedSeason} onClose={handleFormClose} />
            )}

            {/* Page Header */}
            <PageHeader
                title="إدارة المواسم"
                subtitle="تتبع المواسم الزراعية وحالاتها"
                icon="bi-calendar-range"
                gradient="from-cyan-500 to-teal-500"
                actions={
                    <ActionButton
                        label="إضافة موسم جديد"
                        icon="bi-plus-lg"
                        onClick={handleAdd}
                        variant="primary"
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-calendar-range text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي المواسم</p>
                                <p className="text-lg font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-play-circle text-lg text-emerald-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">نشط</p>
                                <p className="text-lg font-bold">{stats.active}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-clock text-lg text-blue-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">قادم</p>
                                <p className="text-lg font-bold">{stats.upcoming}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-check-circle text-lg text-gray-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">مكتمل</p>
                                <p className="text-lg font-bold">{stats.completed}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <SearchBox
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث عن موسم..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip
                    label="الكل"
                    count={seasons.length}
                    icon="bi-grid"
                    active={selectedFilter === 'all'}
                    onClick={() => setSelectedFilter('all')}
                    color="emerald"
                />
                <FilterChip
                    label="نشط"
                    count={stats.active}
                    icon="bi-play-circle"
                    active={selectedFilter === 'ACTIVE'}
                    onClick={() => setSelectedFilter('ACTIVE')}
                    color="emerald"
                />
                <FilterChip
                    label="قادم"
                    count={stats.upcoming}
                    icon="bi-clock"
                    active={selectedFilter === 'UPCOMING'}
                    onClick={() => setSelectedFilter('UPCOMING')}
                    color="blue"
                />
                <FilterChip
                    label="مكتمل"
                    count={stats.completed}
                    icon="bi-check-circle"
                    active={selectedFilter === 'COMPLETED'}
                    onClick={() => setSelectedFilter('COMPLETED')}
                    color="amber"
                />
            </div>

            {/* Seasons Table */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-list-ul text-cyan-500" />
                        قائمة المواسم
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                            {filteredSeasons.length}
                        </span>
                    </h5>
                </div>
                <div>
                    {filteredSeasons.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-calendar-x text-5xl text-cyan-400 dark:text-cyan-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا توجد مواسم</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">قم بإضافة المواسم الزراعية للبدء</p>
                            <button onClick={handleAdd} className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-all hover-scale">
                                <i className="bi bi-plus-lg ml-2" />
                                إضافة أول موسم
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-right">اسم الموسم</th>
                                        <th className="px-6 py-4 font-bold text-right">تاريخ البداية</th>
                                        <th className="px-6 py-4 font-bold text-right">تاريخ النهاية</th>
                                        <th className="px-6 py-4 font-bold text-right">الحالة</th>
                                        <th className="px-6 py-4 font-bold text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {filteredSeasons.map((season, idx) => {
                                        const statusBadge = getStatusBadge(season.status);
                                        return (
                                            <tr key={season.season_id} className={`bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/50 dark:to-teal-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                                            <i className="bi bi-calendar" />
                                                        </div>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{season.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {new Date(season.start_date).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {new Date(season.end_date).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${statusBadge.className}`}>
                                                        <i className={`bi ${statusBadge.icon} text-[10px]`} />
                                                        {statusBadge.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1 justify-end">
                                                        <button
                                                            onClick={() => handleEdit(season)}
                                                            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                                                            title="تعديل"
                                                        >
                                                            <i className="bi bi-pencil" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(season)}
                                                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                                            title="حذف"
                                                        >
                                                            <i className="bi bi-trash" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
