/**
 * SecondaryKpisWidget - Displays the 4 secondary KPI cards (debts, operations)
 * Extracted from Dashboard.js renderWidget switch case
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassKpiCard } from '../DashboardWidgets';

export function SecondaryKpisWidget({ kpis, formatCurrency, formatNumber }) {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassKpiCard
                title="مستحقات من العملاء"
                value={kpis.total_receivables}
                icon="bi-person-check"
                gradient="from-yellow-500 to-amber-500"
                onClick={() => navigate('/debtors?type=receivables')}
                subtitle="عملاء مدينين"
                formatValue={(v) => formatCurrency(v, true)}
                delay={0}
            />
            <GlassKpiCard
                title="مستحقات للموردين"
                value={kpis.total_payables}
                icon="bi-truck"
                gradient="from-red-500 to-rose-500"
                onClick={() => navigate('/debtors?type=payables')}
                subtitle="موردين دائنين"
                formatValue={(v) => formatCurrency(v, true)}
                delay={100}
            />
            <GlassKpiCard
                title="عدد المبيعات"
                value={kpis.sales_count}
                icon="bi-receipt"
                gradient="from-purple-500 to-violet-500"
                subtitle="عملية"
                formatValue={formatNumber}
                delay={200}
            />
            <GlassKpiCard
                title="عدد المشتريات"
                value={kpis.purchases_count}
                icon="bi-bag"
                gradient="from-teal-500 to-cyan-500"
                subtitle="عملية"
                formatValue={formatNumber}
                delay={300}
            />
        </div>
    );
}

export default SecondaryKpisWidget;
