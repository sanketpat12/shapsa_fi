import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiBell } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

          {/* Notification Bell - visible to customer and retailer */}
          {user && (user.role === 'customer' || user.role === 'retailer') && (
            <div className="notification-menu-container" ref={bellRef}>
              <button
                className="nav-action-btn notification-btn"
                onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false); }}
                title="Notifications"
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {bellOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <span className="notification-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button className="mark-read-btn" onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <span>🔔</span>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => markOneRead(notif.id)}
                        >
                          <span className="notif-icon">{notif.icon}</span>
                          <div className="notif-body">
                            <p className="notif-title">{notif.title}</p>
                            <p className="notif-message">{notif.message}</p>
                            <p className="notif-time">{formatDate(notif.time)}</p>
                          </div>
                          {!notif.read && <span className="notif-dot" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user && (
            <div className="profile-menu-container" ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false); }}
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
