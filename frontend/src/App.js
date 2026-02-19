import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// Context

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SeasonProvider } from './context/SeasonContext';

// Components - non-lazy (always needed)
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalSearch from './components/GlobalSearch';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { ErrorBoundary, PageLoading } from './components/common';
import ReloadPrompt from './components/common/ReloadPrompt';

// Pages - Lazy loaded for better performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InventoryView = lazy(() => import('./pages/InventoryView'));
const InventoryAdjustment = lazy(() => import('./pages/InventoryAdjustment'));
const SaleManagement = lazy(() => import('./pages/SaleManagement'));
const PurchaseManagement = lazy(() => import('./pages/PurchaseManagement'));
const GeneralLedger = lazy(() => import('./pages/GeneralLedger'));
const TrialBalance = lazy(() => import('./pages/TrialBalance'));
const CropManagement = lazy(() => import('./pages/CropManagement'));
const ContactManagement = lazy(() => import('./pages/ContactManagement'));
const ContactDetails = lazy(() => import('./pages/ContactDetails'));
const FinancialAccountManagement = lazy(() => import('./pages/FinancialAccountManagement'));
const ExpenseManagement = lazy(() => import('./pages/ExpenseManagement'));
const TreasuryManagement = lazy(() => import('./pages/TreasuryManagement'));
const IncomeStatement = lazy(() => import('./pages/IncomeStatement'));
const BalanceSheet = lazy(() => import('./pages/BalanceSheet'));
const JournalView = lazy(() => import('./pages/JournalView'));
const EquityStatement = lazy(() => import('./pages/EquityStatement'));
const SeasonManagement = lazy(() => import('./pages/SeasonManagement'));
const DailyPrices = lazy(() => import('./pages/DailyPrices'));
const CapitalDistribution = lazy(() => import('./pages/CapitalDistribution'));
const CashFlowReport = lazy(() => import('./pages/CashFlowReport'));
const BackupManagement = lazy(() => import('./pages/BackupManagement'));
const DebtorsView = lazy(() => import('./pages/DebtorsView'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ReportsHub = lazy(() => import('./pages/ReportsHub'));
const CropPerformance = lazy(() => import('./pages/CropPerformance'));
const TransformationManagement = lazy(() => import('./pages/TransformationManagement'));
const CardexReport = lazy(() => import('./pages/CardexReport'));

function App() {
    return (

        <ThemeProvider>
            <AuthProvider>
                <SeasonProvider>

                    <ErrorBoundary>
                        <ReloadPrompt />
                        <Router>
                            <GlobalSearch />
                            <KeyboardShortcuts />
                            <Routes>
                                {/* صفحة تسجيل الدخول - بدون Layout */}
                                <Route path="/login" element={
                                    <Suspense fallback={<PageLoading />}>
                                        <Login />
                                    </Suspense>
                                } />

                                {/* الصفحات المحمية - مع Layout */}
                                <Route path="/*" element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <ErrorBoundary
                                                fallback={
                                                    <div className="flex items-center justify-center min-h-[60vh] p-8">
                                                        <div className="max-w-md w-full text-center">
                                                            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-lg">
                                                                <i className="bi bi-exclamation-triangle text-4xl text-red-500 dark:text-red-400"></i>
                                                            </div>
                                                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                                                حدث خطأ في هذه الصفحة
                                                            </h2>
                                                            <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">
                                                                يمكنك العودة للصفحة الرئيسية أو تحديث الصفحة
                                                            </p>
                                                            <div className="flex gap-3 justify-center">
                                                                <a href="/dashboard" className="px-5 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-medium text-sm">
                                                                    <i className="bi bi-house ml-1"></i>
                                                                    الصفحة الرئيسية
                                                                </a>
                                                                <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-sm shadow-lg">
                                                                    <i className="bi bi-arrow-clockwise ml-1"></i>
                                                                    تحديث الصفحة
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <Suspense fallback={<PageLoading />}>
                                                    <Routes>
                                                        {/* Main Pages */}
                                                        <Route path="/dashboard" element={<Dashboard />} />
                                                        <Route path="/inventory" element={<InventoryView />} />
                                                        <Route path="/inventory-adjustments" element={<InventoryAdjustment />} />
                                                        <Route path="/sales" element={<SaleManagement />} />
                                                        <Route path="/purchases" element={<PurchaseManagement />} />
                                                        <Route path="/expenses" element={<ExpenseManagement />} />
                                                        <Route path="/treasury" element={<TreasuryManagement />} />
                                                        <Route path="/journal" element={<JournalView />} />

                                                        {/* Reports Hub */}
                                                        <Route path="/reports" element={<ReportsHub />} />

                                                        {/* Financial Reports */}
                                                        <Route path="/general-ledger" element={<GeneralLedger />} />
                                                        <Route path="/trial-balance" element={<TrialBalance />} />
                                                        <Route path="/income-statement" element={<IncomeStatement />} />
                                                        <Route path="/balance-sheet" element={<BalanceSheet />} />
                                                        <Route path="/equity-statement" element={<EquityStatement />} />
                                                        <Route path="/capital-distribution" element={<CapitalDistribution />} />
                                                        <Route path="/cash-flow" element={<CashFlowReport />} />
                                                        <Route path="/debtors" element={<DebtorsView />} />
                                                        <Route path="/crop-performance" element={<CropPerformance />} />
                                                        <Route path="/cardex" element={<CardexReport />} />

                                                        {/* Legacy Routes */}
                                                        <Route path="/reports/general-ledger" element={<Navigate to="/general-ledger" replace />} />
                                                        <Route path="/reports/trial-balance" element={<Navigate to="/trial-balance" replace />} />
                                                        <Route path="/reports/income-statement" element={<Navigate to="/income-statement" replace />} />
                                                        <Route path="/reports/balance-sheet" element={<Navigate to="/balance-sheet" replace />} />
                                                        <Route path="/reports/advanced" element={<Navigate to="/reports" replace />} />

                                                        {/* Setup Pages */}
                                                        <Route path="/crops" element={<CropManagement />} />
                                                        <Route path="/contacts" element={<ContactManagement />} />
                                                        <Route path="/contacts/:contactId" element={<ContactDetails />} />
                                                        <Route path="/financial-accounts" element={<FinancialAccountManagement />} />

                                                        {/* New Features */}
                                                        <Route path="/seasons" element={<SeasonManagement />} />
                                                        <Route path="/daily-prices" element={<DailyPrices />} />
                                                        <Route path="/backups" element={<BackupManagement />} />
                                                        <Route path="/users" element={<UserManagement />} />
                                                        <Route path="/transformations" element={<TransformationManagement />} />

                                                        {/* Default Redirect */}
                                                        <Route path="*" element={<Navigate to="/dashboard" />} />
                                                    </Routes>
                                                </Suspense>
                                            </ErrorBoundary>
                                        </Layout>
                                    </ProtectedRoute>
                                } />
                            </Routes>
                        </Router>
                    </ErrorBoundary>

                </SeasonProvider>
            </AuthProvider>
        </ThemeProvider>

    );
}

export default App;
