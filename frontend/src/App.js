import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalSearch from './components/GlobalSearch';
import KeyboardShortcuts from './components/KeyboardShortcuts';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InventoryView from './pages/InventoryView';
import InventoryAdjustment from './pages/InventoryAdjustment';
import SaleManagement from './pages/SaleManagement';
import PurchaseManagement from './pages/PurchaseManagement';
import GeneralLedger from './pages/GeneralLedger';
import TrialBalance from './pages/TrialBalance';
import CropManagement from './pages/CropManagement';
import ContactManagement from './pages/ContactManagement';
import ContactDetails from './pages/ContactDetails';
import FinancialAccountManagement from './pages/FinancialAccountManagement';
import ExpenseManagement from './pages/ExpenseManagement';
import TreasuryManagement from './pages/TreasuryManagement';
import IncomeStatement from './pages/IncomeStatement';
import BalanceSheet from './pages/BalanceSheet';
import JournalView from './pages/JournalView';
import EquityStatement from './pages/EquityStatement';
import SeasonManagement from './pages/SeasonManagement';
import DailyPrices from './pages/DailyPrices';
import CapitalDistribution from './pages/CapitalDistribution';
import CashFlowReport from './pages/CashFlowReport';

import BackupManagement from './pages/BackupManagement';
import DebtorsView from './pages/DebtorsView';
import UserManagement from './pages/UserManagement';

// New Pages
import ReportsHub from './pages/ReportsHub';
import CropPerformance from './pages/CropPerformance';
import TransformationManagement from './pages/TransformationManagement';
import CardexReport from './pages/CardexReport';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <GlobalSearch />
            <KeyboardShortcuts />
            <Routes>
              {/* صفحة تسجيل الدخول - بدون Layout */}
              <Route path="/login" element={<Login />} />

              {/* الصفحات المحمية - مع Layout */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
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

                      {/* Financial Reports (accessed via Reports Hub or direct link) */}
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

                      {/* Legacy Routes (Redirect to new paths if needed) */}
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
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
