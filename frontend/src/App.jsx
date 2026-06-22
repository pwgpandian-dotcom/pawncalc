import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import NewLoan      from './pages/NewLoan';
import ActiveLoans  from './pages/ActiveLoans';
import ClosedLoans  from './pages/ClosedLoans';
import OverdueLoans from './pages/OverdueLoans';
import LoanDetail   from './pages/LoanDetail';
import Customers    from './pages/Customers';
import Calculator   from './pages/Calculator';
import Reports      from './pages/Reports';
import Staff        from './pages/Staff';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/"             element={<Dashboard />} />
                    <Route path="/loans/new"    element={<NewLoan />} />
                    <Route path="/loans"        element={<ActiveLoans />} />
                    <Route path="/loans/:id"    element={<LoanDetail />} />
                    <Route path="/closed"       element={<ClosedLoans />} />
                    <Route path="/overdue"      element={<OverdueLoans />} />
                    <Route path="/customers"    element={<Customers />} />
                    <Route path="/calculator"   element={<Calculator />} />
                    <Route path="/reports"      element={<Reports />} />
                    <Route path="/staff"        element={<Staff />} />
                    <Route path="*"             element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
