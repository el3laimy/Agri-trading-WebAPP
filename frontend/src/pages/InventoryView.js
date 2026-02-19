import React, { useState, useMemo } from 'react';
import { useInventory, useCrops } from '../hooks/useQueries';
import { useDebounce } from '../hooks';
import { useToast } from '../components/common';
import { safeParseFloat } from '../utils/mathUtils';

// Import shared components
import { PageHeader, ActionButton, SearchBox, FilterChip, LoadingCard } from '../components/common/PageHeader';
import { InventorySkeleton } from '../components/common';

// Import CSS animations
import '../styles/dashboardAnimations.css';
import '../styles/liquidglass.css';

function InventoryView() {
    const { data: inventory = [], isLoading: inventoryLoading } = useInventory();
    const { data: crops = [], isLoading: cropsLoading } = useCrops();
    const { showSuccess, showError } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Stats
    const stats = useMemo(() => {
        const totalItems = inventory?.length || 0;
        const totalQuantity = inventory?.reduce((sum, item) => sum + safeParseFloat(item.current_stock_kg), 0) || 0;
        const inStock = inventory?.filter(i => safeParseFloat(i.current_stock_kg) > 0).length || 0;
        const outOfStock = inventory?.filter(i => safeParseFloat(i.current_stock_kg) <= 0).length || 0;
        return { totalItems, totalQuantity, inStock, outOfStock };
    }, [inventory]);

    const formatQuantity = (value) => {
        if (value >= 1000) return (value / 1000).toFixed(1) + ' طن';
        return value?.toFixed(0) + ' كجم';
    };

    // Filter inventory
    const filteredInventory = useMemo(() => {
        return (inventory || []).filter(item => {
            const matchesSearch = item.crop?.crop_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const stockKg = safeParseFloat(item.current_stock_kg);
            const matchesFilter = selectedFilter === 'all' ? true :
                selectedFilter === 'inStock' ? stockKg > 0 :
                    selectedFilter === 'outOfStock' ? stockKg <= 0 : true;
            return matchesSearch && matchesFilter;
        });
    }, [inventory, debouncedSearchTerm, selectedFilter]);

    // Loading state
    if (inventoryLoading) {
        return <InventorySkeleton cardCount={6} />;
    }

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
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-box-seam text-lg" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">عدد الأصناف</p>
                                <p className="text-lg font-bold">{stats.totalItems}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-bar-chart text-lg text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">إجمالي الكمية</p>
                                <p className="text-lg font-bold">{formatQuantity(stats.totalQuantity)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center lg-animate-float">
                                <i className="bi bi-check-circle text-lg text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-white/70">متوفر</p>
                                <p className="text-lg font-bold">{stats.inStock}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-xl text-white lg-animate-in" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', animationDelay: '300ms' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center lg-animate-float">
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
            <div className="lg-card overflow-hidden lg-animate-fade">
                <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--lg-glass-border-subtle)', background: 'var(--lg-glass-bg)' }}>
                    <h5 className="font-bold flex items-center gap-2" style={{ color: 'var(--lg-text-primary)' }}>
                        <i className="bi bi-box-seam text-indigo-500" />
                        قائمة المخزون
                        <span className="lg-badge px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(99,102,241,0.15)', color: 'rgb(79,70,229)' }}>
                            {filteredInventory.length}
                        </span>
                    </h5>
                </div>
                <div className="p-6">
                    {filteredInventory.length === 0 ? (
                        <div className="text-center py-16 lg-animate-fade">
                            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center lg-animate-float" style={{ borderRadius: 'var(--lg-radius-lg)', background: 'var(--lg-glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--lg-glass-border)' }}>
                                <i className="bi bi-box-seam text-5xl" style={{ color: 'var(--lg-text-muted)' }} />
                            </div>
                            <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--lg-text-primary)' }}>لا يوجد مخزون</h4>
                            <p className="text-sm" style={{ color: 'var(--lg-text-muted)' }}>ابدأ بتسجيل عمليات الشراء لتظهر هنا</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredInventory.map((item, idx) => (
                                <div key={item.inventory_id || idx} className={`lg-card lg-hover-lift p-4 rounded-xl transition-all lg-animate-in`} style={{ animationDelay: `${Math.min(idx, 7) * 100}ms` }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'var(--lg-glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--lg-glass-border)' }}>
                                            <i className="bi bi-flower1 text-2xl" style={{ color: 'var(--lg-primary)' }} />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold" style={{ color: 'var(--lg-text-primary)' }}>{item.crop?.crop_name || 'غير محدد'}</h5>
                                            <p className="text-2xl font-bold" style={{ color: 'var(--lg-primary)' }}>
                                                {formatQuantity(parseFloat(item.current_stock_kg) || 0)}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${parseFloat(item.current_stock_kg) > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                            {parseFloat(item.current_stock_kg) > 0 ? 'متوفر' : 'نفذ'}
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
