import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './Header.css';

export default function Header() {
  const { logout, isAdmin, isAuthenticated } = useAuth();
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  if (!isAuthenticated) return null;

  return (
    <header className="main-header">
      <div className="header-container">
        <Link to={isAdmin ? "/admin" : "/shop"} className="logo" onClick={closeMenu}>
          WORLD OF<span>TSHIRTS</span>
        </Link>

        {/* 🍔 Mobile Hamburger Button */}
        <button 
          className={`mobile-menu-btn ${menuOpen ? 'open' : ''}`} 
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle Menu"
          aria-expanded={menuOpen}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {/* Overlay backdrop - closes menu when tapped */}
        <div 
          className={`mobile-overlay ${menuOpen ? 'open' : ''}`} 
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Navigation Drawer */}
        <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          {isAdmin ? (
            <>
              <Link to="/admin" className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`} onClick={closeMenu}>Dashboard</Link>
              <Link to="/orders" className={`nav-item ${location.pathname === '/orders' ? 'active' : ''}`} onClick={closeMenu}>Manage Orders</Link>
              <Link to="/user-management" className={`nav-item ${location.pathname === '/user-management' ? 'active' : ''}`} onClick={closeMenu}>Users</Link>
            </>
          ) : (
            <>
              <Link to="/shop" className={`nav-item ${location.pathname === '/shop' ? 'active' : ''}`} onClick={closeMenu}>Shop</Link>
              <Link to="/order-status" className={`nav-item ${location.pathname === '/order-status' ? 'active' : ''}`} onClick={closeMenu}>My Orders</Link>
            </>
          )}

          {/* Mobile Actions Drawer Content */}
          <div className="mobile-only-actions">
            {!isAdmin && (
              <Link to="/cart" className={`nav-item ${location.pathname === '/cart' ? 'active' : ''}`} onClick={closeMenu}>
                Cart ({cartCount})
              </Link>
            )}
            <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={closeMenu}>
              Profile
            </Link>
            <button onClick={() => { closeMenu(); handleLogout(); }} className="logout-btn mobile-logout">
              Logout
            </button>
          </div>
        </nav>

        {/* Desktop Actions Row */}
        <div className="header-actions desktop-only-actions">
          {!isAdmin && (
            <Link to="/cart" className={`action-btn cart-btn ${location.pathname === '/cart' ? 'active-icon' : ''}`}>
              <span role="img" aria-label="cart">🛒</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}
          <Link to="/profile" className={`action-btn profile-btn ${location.pathname === '/profile' ? 'active-icon' : ''}`} title="View Profile">
            <span role="img" aria-label="profile">👤</span>
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
