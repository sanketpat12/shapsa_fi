import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

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

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />

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
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
