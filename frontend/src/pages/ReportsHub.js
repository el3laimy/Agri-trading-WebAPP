import React from 'react';
import { ReportCard } from '../components/reports';
import { PageHeader } from '../components/common';

function ReportsHub() {
    const reports = [
        {
            title: "دفتر الأستاذ العام",
            description: "عرض جميع الحركات المالية وتفاصيل الحسابات",
            icon: "bi-book",
            to: "/general-ledger",
            color: "primary"
        },
        {
            title: "ميزان المراجعة",
            description: "ملخص أرصدة الحسابات الدائنة والمدينة",
            icon: "bi-scale",
            to: "/trial-balance",
            color: "success"
        },
        {
            title: "قائمة الدخل",
            description: "تقرير الأرباح والخسائر والنتائج التشغيلية",
            icon: "bi-graph-up-arrow",
            to: "/income-statement",
            color: "info"
        },
        {
            title: "الميزانية العمومية",
            description: "المركز المالي للشركة (أصول، خصوم، حقوق ملكية)",
            icon: "bi-bank",
            to: "/balance-sheet",
            color: "warning"
        },
        {
            title: "التدفقات النقدية",
            description: "تحليل مصادر واستخدامات النقدية في الشركة",
            icon: "bi-cash-stack",
            to: "/cash-flow",
            color: "success"
        },
        {
            title: "بيان حقوق الملكية",
            description: "تتبع التغيرات في حقوق الملاك ورأس المال",
            icon: "bi-pie-chart",
            to: "/equity-statement",
            color: "indigo"
        },
        {
            title: "مديونيات العملاء والموردين",
            description: "متابعة الديون المستحقة والالتزامات",
            icon: "bi-people",
            to: "/debtors",
            color: "danger"
        },
        {
            title: "أداء المحاصيل",
            description: "تحليل ربحية وتكاليف كل محصول على حدة",
            icon: "bi-flower1",
            to: "/crop-performance",
            color: "teal"
        }
    ];

    return (
        <div className="container-fluid">
            <PageHeader
                title="مركز التقارير المالية"
                subtitle="نظرة شاملة على أداء الشركة ووضعها المالي"
                icon="bi-file-earmark-text"
            />

            <div className="row g-4">
                {reports.map((report, index) => (
                    <ReportCard
                        key={index}
                        {...report}
                    />
                ))}
            </div>
        </div>
    );
}

export default ReportsHub;
