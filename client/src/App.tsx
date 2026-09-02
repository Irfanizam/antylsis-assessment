import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Receipts } from './pages/Receipts';
import { Vouchers } from './pages/Vouchers';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminReceipts } from './pages/AdminReceipts';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute admin />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/receipts" element={<AdminReceipts />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
