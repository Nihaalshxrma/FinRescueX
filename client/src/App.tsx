import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { LoanDashboardPage } from './pages/LoanDashboardPage';
import { LoanWizardPage } from './pages/LoanWizardPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { ActiveLoansPage } from './pages/ActiveLoansPage';
import { AssistantPage } from './pages/AssistantPage';
import { SupportPage } from './pages/SupportPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">Authenticating...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          {/* Customer Mobile Routes */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><LoanDashboardPage /></ProtectedRoute>} />
          <Route path="/loan/apply/:id" element={<ProtectedRoute><LoanWizardPage /></ProtectedRoute>} />
          <Route path="/loan/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
          <Route path="/active-loans" element={<ProtectedRoute><ActiveLoansPage /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
