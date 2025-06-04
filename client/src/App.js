// client/src/App.jsx

import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

// NO LONGER import AuthProvider here, it's in index.js
import { useAuth } from './context/AuthContext'; // Keep useAuth hook

import Auth from './components/Auth';
import Verify from './components/Verify';
import ProductGrid from './pages/ProductGrid';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import AdminPanel from './pages/AdminPanel';
import Checkout from './pages/Checkout';
import OrderAdminPanel from './pages/OrderAdminPanel';
import Payment from './pages/Payment';
import OrderSuccess from './pages/OrderSuccess';
import OrderStatusPage from './pages/OrderStatusPage';
import UserManagement from './pages/UserManagement';
import BannedPage from './pages/BannedPage';

// Helper component for protected routes
const ProtectedRoute = ({ children, requiresAdmin = false }) => {
  const { isAuthenticated, isAdmin, isBanned, loading } = useAuth(); // Get state from context

  if (loading) {
    return <div>Loading user status...</div>; // Show a loading indicator while auth is being checked
  }

  if (isBanned) {
    return <Navigate to="/banned" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // Redirect to the main public route (Auth component)
  }

  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/shop" replace />; // Redirect non-admins trying to access admin routes
  }

  return children;
};

function App() {
  const navigate = useNavigate();
  const { search, pathname } = useLocation();
  const { checkAuthStatus } = useAuth(); // <--- This line is now safe

  // Handle OAuth token in URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    const tokenFromUrl = params.get('token');

    if (tokenFromUrl) {
      console.log('📥 Captured OAuth token:', tokenFromUrl);
      localStorage.setItem('token', tokenFromUrl); // Store the token

      // CRUCIAL CHANGE: Explicitly call checkAuthStatus after setting token
      checkAuthStatus();

      params.delete('token');
      navigate({ pathname, search: params.toString() }, { replace: true });
    }
  }, [search, pathname, navigate, checkAuthStatus]);

  return (
    // NO LONGER wrap with AuthProvider here, it's in index.js
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Auth />} /> {/* This is now your primary login/signup page */}
      <Route path="/verify" element={<Verify />} />
      <Route path="/banned" element={<BannedPage />} />

      {/* Protected User Routes (accessible to any authenticated user) */}
      <Route path="/shop" element={<ProtectedRoute><ProductGrid /></ProtectedRoute>} />
      <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
      <Route path="/order-status" element={<ProtectedRoute><OrderStatusPage /></ProtectedRoute>} />

      {/* Protected Admin Routes (accessible only to authenticated admins) */}
      <Route path="/admin" element={<ProtectedRoute requiresAdmin={true}><AdminPanel /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute requiresAdmin={true}><OrderAdminPanel /></ProtectedRoute>} />
      <Route path='/user-management' element={<ProtectedRoute requiresAdmin={true}><UserManagement /></ProtectedRoute>} />

      {/* Fallback for any unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;