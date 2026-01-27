/**
 * MainKpisWidget - Displays the 4 main KPI cards
 * Extracted from Dashboard.js renderWidget switch case
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassKpiCard } from '../DashboardWidgets';

export function MainKpisWidget({ kpis, formatCurrency, formatNumber }) {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassKpiCard
                title="إجمالي الإيرادات"
                value={kpis.total_revenue}
                icon="bi-cash-stack"
                gradient="from-emerald-500 to-teal-500"
                onClick={() => navigate('/sales')}
                formatValue={(v) => formatCurrency(v, true)}
                delay={0}
            />
            <GlassKpiCard
                title="صافي الربح"
                value={kpis.net_profit}
                icon="bi-graph-up-arrow"
                gradient="from-green-500 to-emerald-500"
                onClick={() => navigate('/reports/income-statement')}
                formatValue={(v) => formatCurrency(v, true)}
                delay={100}
            />
            <GlassKpiCard
                title="قيمة المخزون"
                value={kpis.inventory_value}
                icon="bi-box-seam"
                gradient="from-amber-500 to-orange-500"
                subtitle={`${formatNumber(kpis.total_stock_kg)} كجم`}
                onClick={() => navigate('/inventory')}
                formatValue={(v) => formatCurrency(v, true)}
                delay={200}
            />
            <GlassKpiCard
                title="رصيد الخزينة"
                value={kpis.cash_balance}
                icon="bi-wallet2"
                gradient="from-blue-500 to-cyan-500"
                onClick={() => navigate('/treasury')}
                formatValue={(v) => formatCurrency(v, true)}
                delay={300}
            />
        </div>
    );
}

export default MainKpisWidget;
