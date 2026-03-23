import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'customer':
        return [
          { path: '/customer', label: 'Home' },
          { path: '/customer/products', label: 'Products' },
          { path: '/customer/orders', label: 'My Orders' },
          { path: '/customer/deals', label: 'Deals' }
        ];
      case 'retailer':
        return [
          { path: '/retailer', label: 'Dashboard' },
          { path: '/retailer/products', label: 'My Products' },
          { path: '/retailer/inventory', label: 'Inventory' },
          { path: '/retailer/orders', label: 'Orders' }
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard' },
          { path: '/admin/customers', label: 'Customers' },
          { path: '/admin/retailers', label: 'Retailers' },
          { path: '/admin/settings', label: 'Settings' }
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={user ? `/${user.role}` : '/login'} className="navbar-brand">
          <span className="brand-icon">🛍️</span>
          <span className="brand-text">Shopsa</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {user?.role === 'customer' && (
            <>
              <Link to="/customer/products" className="nav-action-btn">
                <FiSearch />
              </Link>
              <Link to="/customer/cart" className="nav-action-btn cart-btn">
                <FiShoppingCart />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </>
          )}

          {user && (
            <div className="profile-menu-container">
              <button
                className="profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="profile-avatar">{user.avatar || user.name[0]}</div>
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <div className="profile-avatar-lg">{user.avatar || user.name[0]}</div>
                    <div>
                      <p className="profile-name">{user.name}</p>
                      <p className="profile-role">{user.role}</p>
                    </div>
                  </div>
                  <hr />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
}
