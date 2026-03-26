import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiBell, FiGlobe } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const bellRef = useRef(null);
  const profileRef = useRef(null);
  const langRef = useRef(null);
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
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
          { path: '/customer', label: t('nav.home') },
          { path: '/customer/products', label: t('nav.products') },
          { path: '/customer/orders', label: t('nav.myOrders') },
          { path: '/customer/deals', label: t('nav.deals') }
        ];
      case 'retailer':
        return [
          { path: '/retailer', label: t('nav.dashboard') },
          { path: '/retailer/products', label: t('nav.myProducts') },
          { path: '/retailer/inventory', label: t('nav.inventory') },
          { path: '/retailer/orders', label: t('nav.orders') }
        ];
      case 'admin':
        return [
          { path: '/admin', label: t('nav.dashboard') },
          { path: '/admin/customers', label: t('nav.customers') },
          { path: '/admin/retailers', label: t('nav.retailers') },
          { path: '/admin/settings', label: t('nav.settings') }
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

          {/* Language Switcher */}
          <div className="profile-menu-container" ref={langRef}>
            <button
              className="nav-action-btn"
              onClick={() => { setLangOpen(!langOpen); setBellOpen(false); setProfileOpen(false); }}
              title="Change Language"
            >
              <FiGlobe size={20} /> <span style={{fontSize: '0.8rem', fontWeight: 600, marginLeft: 6}}>{i18n.language.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="profile-dropdown" style={{ minWidth: '160px' }}>
                <div className="profile-info" style={{ paddingBottom: 8, marginBottom: 4 }}>
                  <p className="profile-name" style={{ fontSize: '0.9rem' }}>{t('common.language')}</p>
                </div>
                <hr style={{ margin: '4px 0' }} />
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {languages.map(lang => (
                    <button 
                      key={lang.code} 
                      className={`dropdown-item ${i18n.language === lang.code ? 'active' : ''}`}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                      style={{ padding: '8px 16px', fontSize: '0.9rem', justifyContent: 'flex-start', color: i18n.language === lang.code ? 'var(--primary)' : 'inherit' }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell - visible to customer and retailer */}
          {user && (user.role === 'customer' || user.role === 'retailer') && (
            <div className="notification-menu-container" ref={bellRef}>
              <button
                className="nav-action-btn notification-btn"
                onClick={() => { setBellOpen(!bellOpen); setProfileOpen(false); setLangOpen(false); }}
                title={t('nav.notifications')}
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {bellOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <span className="notification-title">{t('nav.notifications')}</span>
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
                onClick={() => { setProfileOpen(!profileOpen); setBellOpen(false); setLangOpen(false); }}
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
                    <FiLogOut /> {t('nav.logout')}
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
