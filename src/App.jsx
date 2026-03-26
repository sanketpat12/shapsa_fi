import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AIAssistant from './components/AIAssistant';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Products from './pages/customer/Products';
import Cart from './pages/customer/Cart';
import Orders from './pages/customer/Orders';
import Deals from './pages/customer/Deals';

// Retailer pages
import RetailerDashboard from './pages/retailer/RetailerDashboard';
import AddProduct from './pages/retailer/AddProduct';
import Inventory from './pages/retailer/Inventory';
import RetailerOrders from './pages/retailer/RetailerOrders';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCustomers from './pages/admin/ManageCustomers';
import ManageRetailers from './pages/admin/ManageRetailers';
import SiteSettings from './pages/admin/SiteSettings';

function AppRoutes() {
  const { user } = useAuth();
  const [newOrderToast, setNewOrderToast] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'retailer') return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `retailer_id=eq.${user.id}`,
        },
        (payload) => {
          setNewOrderToast(`🎉 New order received for ₹${payload.new.total_price}!`);
          setTimeout(() => setNewOrderToast(null), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <>
      {user && <Navbar />}
      {newOrderToast && (
        <div style={{
          position: 'fixed', top: 80, right: 20, background: 'var(--success)', color: 'white',
          padding: '16px 24px', borderRadius: 8, boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          zIndex: 9999, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12
        }}>
          {newOrderToast}
        </div>
      )}
      {/* AI Shopping Assistant — only for customers */}
      {user?.role === 'customer' && <AIAssistant />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <Register />} />

        {/* Customer Routes */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRole="customer"><CustomerDashboard /></ProtectedRoute>
        } />
        <Route path="/customer/products" element={
          <ProtectedRoute allowedRole="customer"><Products /></ProtectedRoute>
        } />
        <Route path="/customer/cart" element={
          <ProtectedRoute allowedRole="customer"><Cart /></ProtectedRoute>
        } />
        <Route path="/customer/orders" element={
          <ProtectedRoute allowedRole="customer"><Orders /></ProtectedRoute>
        } />
        <Route path="/customer/deals" element={
          <ProtectedRoute allowedRole="customer"><Deals /></ProtectedRoute>
        } />

        {/* Retailer Routes */}
        <Route path="/retailer" element={
          <ProtectedRoute allowedRole="retailer"><RetailerDashboard /></ProtectedRoute>
        } />
        <Route path="/retailer/products" element={
          <ProtectedRoute allowedRole="retailer"><AddProduct /></ProtectedRoute>
        } />
        <Route path="/retailer/inventory" element={
          <ProtectedRoute allowedRole="retailer"><Inventory /></ProtectedRoute>
        } />
        <Route path="/retailer/orders" element={
          <ProtectedRoute allowedRole="retailer"><RetailerOrders /></ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/customers" element={
          <ProtectedRoute allowedRole="admin"><ManageCustomers /></ProtectedRoute>
        } />
        <Route path="/admin/retailers" element={
          <ProtectedRoute allowedRole="admin"><ManageRetailers /></ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRole="admin"><SiteSettings /></ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={user ? `/${user.role}` : '/login'} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
