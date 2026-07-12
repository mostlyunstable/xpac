import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CampaignWizard = lazy(() => import('./pages/CampaignWizard'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const SupportCenter = lazy(() => import('./pages/SupportCenter'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCampaigns = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminActivity = lazy(() => import('./pages/admin/AdminActivity'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin" />
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </div>
    </div>
  );
}

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isAdmin, isCustomer, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'customer' && !isCustomer) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

function CustomerRoutes() {
  return (
    <Route element={
      <ProtectedRoute requiredRole="customer">
        <AppLayout />
      </ProtectedRoute>
    }>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/campaigns" element={<CampaignWizard />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetails />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/support" element={<SupportCenter />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}

function AdminRoutes() {
  return (
    <Route element={
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    }>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/campaigns" element={<AdminCampaigns />} />
      <Route path="/admin/campaigns/:id" element={<AdminCampaigns />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/support" element={<AdminSupport />} />
      <Route path="/admin/support/:id" element={<AdminSupport />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/activity" element={<AdminActivity />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </Route>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <CustomerRoutes />
        <AdminRoutes />
      </Routes>
    </Suspense>
  );
}