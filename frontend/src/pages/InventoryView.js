import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';

// Import CSS animations
import '../styles/dashboardAnimations.css';

function InventoryView() {
    const { inventory, crops } = useData();
    const { showSuccess, showError } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Stats
    const stats = useMemo(() => {
        const totalItems = inventory?.length || 0;
        const totalQuantity = inventory?.reduce((sum, item) => sum + (item.quantity_kg || 0), 0) || 0;
        const inStock = inventory?.filter(i => i.quantity_kg > 0).length || 0;
        const outOfStock = inventory?.filter(i => i.quantity_kg <= 0).length || 0;
        return { totalItems, totalQuantity, inStock, outOfStock };
    }, [inventory]);

    const formatQuantity = (value) => {
        if (value >= 1000) return (value / 1000).toFixed(1) + ' طن';
        return value?.toFixed(0) + ' كجم';
    };

    // Filter inventory
    const filteredInventory = useMemo(() => {
        return (inventory || []).filter(item => {
            const matchesSearch = item.crop?.crop_name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = selectedFilter === 'all' ? true :
                selectedFilter === 'inStock' ? item.quantity_kg > 0 :
                    selectedFilter === 'outOfStock' ? item.quantity_kg <= 0 : true;
            return matchesSearch && matchesFilter;
        });
    }, [inventory, searchTerm, selectedFilter]);

    return (
        <div className="p-6 max-w-full mx-auto">
            {/* Page Header */}
            <PageHeader
                title="عرض المخزون"
                subtitle="تتبع الكميات المتاحة من جميع المحاصيل"
                icon="bi-box-seam"
                gradient="from-indigo-500 to-violet-500"
                actions={
                    <ActionButton
                        label="تسوية مخزون"
                        icon="bi-arrow-repeat"
                        onClick={() => window.location.href = '/inventory-adjustments'}
                        variant="primary"
                    />
                }
            >
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-float">
                                <i className="bi bi-box-seam text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">عدد الأصناف</p>
                                <p className="text-lg font-bold">{stats.totalItems}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-bar-chart text-lg text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي الكمية</p>
                                <p className="text-lg font-bold">{formatQuantity(stats.totalQuantity)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-check-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">متوفر</p>
                                <p className="text-lg font-bold">{stats.inStock}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-premium px-4 py-3 rounded-xl text-white animate-fade-in-up stagger-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center animate-float">
                                <i className="bi bi-exclamation-circle text-lg text-red-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">نفذ</p>
                                <p className="text-lg font-bold">{stats.outOfStock}</p>
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
                    placeholder="بحث بالمحصول..."
                    className="w-full md:w-96"
                />
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <FilterChip
                    label="الكل"
                    count={inventory?.length || 0}
                    icon="bi-grid"
                    active={selectedFilter === 'all'}
                    onClick={() => setSelectedFilter('all')}
                    color="emerald"
                />
                <FilterChip
                    label="متوفر"
                    count={stats.inStock}
                    icon="bi-check-circle"
                    active={selectedFilter === 'inStock'}
                    onClick={() => setSelectedFilter('inStock')}
                    color="emerald"
                />
                <FilterChip
                    label="نفذ"
                    count={stats.outOfStock}
                    icon="bi-exclamation-circle"
                    active={selectedFilter === 'outOfStock'}
                    onClick={() => setSelectedFilter('outOfStock')}
                    color="amber"
                />
            </div>

            {/* Inventory Cards */}
            <div className="neumorphic overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h5 className="text-gray-800 dark:text-gray-100 font-bold flex items-center gap-2">
                        <i className="bi bi-box-seam text-indigo-500" />
                        قائمة المخزون
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                            {filteredInventory.length}
                        </span>
                    </h5>
                </div>
                <div className="p-6">
                    {filteredInventory.length === 0 ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center animate-float">
                                <i className="bi bi-box-seam text-5xl text-indigo-400 dark:text-indigo-500" />
                            </div>
                            <h4 className="text-gray-700 dark:text-gray-300 font-semibold text-lg mb-2">لا يوجد مخزون</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ابدأ بتسجيل عمليات الشراء لتظهر هنا</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredInventory.map((item, idx) => (
                                <div key={item.inventory_id || idx} className={`neumorphic p-4 rounded-xl hover-lift transition-all animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 flex items-center justify-center">
                                            <i className="bi bi-flower1 text-2xl text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-gray-800 dark:text-gray-200">{item.crop?.crop_name || 'غير محدد'}</h5>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {formatQuantity(item.quantity_kg)}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.quantity_kg > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                            {item.quantity_kg > 0 ? 'متوفر' : 'نفذ'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InventoryView;
