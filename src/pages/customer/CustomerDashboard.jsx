import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiArrowRight, FiStar, FiTruck, FiUsers } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="customer-dashboard">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨</span> New Arrivals 2026
          </div>

          <h1 className="hero-title">
            The Future of<br />
            <span className="hero-title-accent">Smart Living</span>
          </h1>

          <p className="hero-description">
            Cutting-edge electronics crafted for the way you live,
            work, and create. Voice-first shopping, powered by AI.
          </p>

          <div className="hero-actions">
            <Link to="/customer/products" className="btn btn-primary btn-lg">
              {t('common.buyNow')} <FiArrowRight />
            </Link>
            <Link to="/customer/orders" className="btn btn-secondary btn-lg">
              {t('nav.myOrders')}
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">50K+</span>
              <span className="hero-stat-label">Happy Customers</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">4.9<FiStar className="star-icon" /></span>
              <span className="hero-stat-label">Avg Rating</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">Free</span>
              <span className="hero-stat-label">2-Day Delivery</span>
            </div>
          </div>
        </div>

        <div className="hero-floating-cards">
          <div className="floating-card card-1">
            <div className="floating-card-img">
              <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60&h=60&fit=crop" alt="ProAudio X1" />
            </div>
            <div className="floating-card-info">
              <span className="floating-card-name">ProAudio X1</span>
              <span className="floating-card-price">$299</span>
            </div>
          </div>

          <div className="floating-card card-2">
            <div className="floating-card-img">
              <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=60&h=60&fit=crop" alt="Lumina Phone 15" />
            </div>
            <div className="floating-card-info">
              <span className="floating-card-name">Lumina Phone 15</span>
              <span className="floating-card-price">$999</span>
            </div>
          </div>

          <div className="floating-card card-3">
            <div className="floating-card-img">
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop" alt="SmartWatch Pro" />
            </div>
            <div className="floating-card-info">
              <span className="floating-card-name">SmartWatch Pro</span>
              <span className="floating-card-price">$449</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="page-container">
        <section className="categories-section">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid">
            {[
              { name: 'Phones', emoji: '📱' },
              { name: 'Laptops', emoji: '💻' },
              { name: 'Audio', emoji: '🎧' },
              { name: 'Wearables', emoji: '⌚' },
              { name: 'Gaming', emoji: '🎮' },
              { name: 'Camera', emoji: '📷' }
            ].map(cat => (
              <Link
                to={`/customer/products?category=${cat.name}`}
                key={cat.name}
                className="category-card"
              >
                <span className="category-emoji">{cat.emoji}</span>
                <span className="category-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="feature-card">
            <div className="feature-icon"><FiTruck /></div>
            <h3>Free Shipping</h3>
            <p>On orders over $50</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiStar /></div>
            <h3>Top Quality</h3>
            <p>Premium products only</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiUsers /></div>
            <h3>24/7 Support</h3>
            <p>We're here to help</p>
          </div>
        </section>
      </div>
    </div>
  );
}
