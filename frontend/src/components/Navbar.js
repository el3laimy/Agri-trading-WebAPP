import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSeason } from '../context/SeasonContext';

function Navbar() {
    const { activeSeason, loading } = useSeason();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">المحاسبة الزراعية</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/dashboard">لوحة التحكم</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/inventory">المخزون</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/sales">إدارة المبيعات</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/purchases">إدارة المشتريات</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/expenses">إدارة المصروفات</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/journal">قيد يومية</NavLink>
                        </li>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                التقارير
                            </a>
                            <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                                <li><NavLink className="dropdown-item" to="/reports/general-ledger">دفتر الأستاذ العام</NavLink></li>
                                <li><NavLink className="dropdown-item" to="/reports/trial-balance">ميزان المراجعة</NavLink></li>
                                <li><NavLink className="dropdown-item" to="/reports/income-statement">قائمة الدخل</NavLink></li>
                                <li><NavLink className="dropdown-item" to="/reports/balance-sheet">الميزانية العمومية</NavLink></li>
                                <li><NavLink className="dropdown-item" to="/reports/equity-statement">بيان حقوق الملكية</NavLink></li>
                            </ul>
                        </li>
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="navbarDropdownSetup" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                الإعدادات
                            </a>
                            <ul className="dropdown-menu" aria-labelledby="navbarDropdownSetup">
                                <li><NavLink className="dropdown-item" to="/crops">إدارة المحاصيل</NavLink></li>
                                <li><NavLink className="dropdown-item" to="/contacts">إدارة جهات التعامل</NavLink></li>
                                <li><NavLink className="dropdown-item" to="/financial-accounts">إدارة الحسابات المالية</NavLink></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><NavLink className="dropdown-item" to="/seasons">إدارة المواسم</NavLink></li>
                                <li><NavLink className="dropdown-item" to="/daily-prices">الأسعار اليومية</NavLink></li>
                            </ul>
                        </li>
                    </ul>
                    <div className="d-flex text-white align-items-center">
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : activeSeason ? (
                            <div className="bg-success bg-opacity-25 px-3 py-1 rounded-pill border border-success border-opacity-50">
                                <small className="text-success-light me-1">الموسم الحالي:</small>
                                <strong className="text-white">{activeSeason.name}</strong>
                            </div>
                        ) : (
                            <div className="bg-warning bg-opacity-25 px-3 py-1 rounded-pill border border-warning border-opacity-50">
                                <small className="text-warning-light">لا يوجد موسم نشط</small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
