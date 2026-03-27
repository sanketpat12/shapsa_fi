import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiArrowRight, FiStar, FiTruck, FiUsers, FiShoppingCart } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './CustomerDashboard.css';
import '../customer/Products.css';

export default function CustomerDashboard() {
  const { user, addToCart, cart } = useAuth();
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12);
      if (!error && data) setFeaturedProducts(data);
    };
    fetchFeatured();
  }, []);

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (!product.stock || product.stock <= 0) {
      setToast(`❌ ${product.name} is out of stock!`);
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const inCart = cart?.find(i => i.id === product.id);
    if (inCart && inCart.quantity >= product.stock) {
      setToast(`❌ Only ${product.stock} unit${product.stock > 1 ? 's' : ''} available!`);
      setTimeout(() => setToast(null), 2500);
      return;
    }
    addToCart(product);
    setToast(`✅ ${product.name} added to cart!`);
    setTimeout(() => setToast(null), 2000);
  };

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
              <span className="floating-card-price">₹299</span>
            </div>
          </div>

          <div className="floating-card card-2">
            <div className="floating-card-img">
              <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=60&h=60&fit=crop" alt="Lumina Phone 15" />
            </div>
            <div className="floating-card-info">
              <span className="floating-card-name">Lumina Phone 15</span>
              <span className="floating-card-price">₹999</span>
            </div>
          </div>

          <div className="floating-card card-3">
            <div className="floating-card-img">
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop" alt="SmartWatch Pro" />
            </div>
            <div className="floating-card-info">
              <span className="floating-card-name">SmartWatch Pro</span>
              <span className="floating-card-price">₹449</span>
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

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="featured-products-section">
            <div className="featured-header">
              <h2 className="section-title">Featured Products</h2>
              <Link to="/customer/products" className="view-all-link">
                View All <FiArrowRight />
              </Link>
            </div>
            <div className="products-grid">
              {featuredProducts.map((product, i) => {
                const hasDiscount = product.deal_active && product.discount > 0;
                const discountedPrice = hasDiscount
                  ? (product.price * (1 - product.discount / 100)).toFixed(0)
                  : null;
                return (
                  <Link
                    to="/customer/products"
                    key={product.id}
                    className="product-card"
                    style={{ animationDelay: `${i * 0.05}s`, textDecoration: 'none', color: 'inherit' }}
                  >
                    {hasDiscount && (
                      <span className="product-badge" style={{ background: '#ef4444' }}>
                        🏷️ {product.discount}% OFF
                      </span>
                    )}
                    {!hasDiscount && product.badge && (
                      <span className="product-badge">{product.badge}</span>
                    )}
                    {product.stock === 0 && (
                      <span className="product-badge" style={{ background: '#6b7280', left: 'auto', right: 12 }}>Out of Stock</span>
                    )}
                    <div className="product-img-container">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="product-img" style={{ opacity: product.stock === 0 ? 0.6 : 1 }} />
                      ) : (
                        <div className="product-img" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 48, background: 'var(--bg-secondary)'
                        }}>📦</div>
                      )}
                      {product.stock > 0 && (
                        <button
                          className="quick-add-btn"
                          onClick={(e) => handleAddToCart(product, e)}
                          title="Add to Cart"
                        >
                          <FiShoppingCart />
                        </button>
                      )}
                    </div>
                    <div className="product-info">
                      <span className="product-category">{product.category}</span>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-desc">
                        {product.description ? product.description.substring(0, 60) + '…' : ''}
                      </p>
                      <div className="product-meta">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {hasDiscount ? (
                            <>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                ₹{product.price}
                              </span>
                              <span className="product-price" style={{ color: '#16a34a' }}>
                                ₹{discountedPrice}
                              </span>
                            </>
                          ) : (
                            <span className="product-price">₹{product.price}</span>
                          )}
                        </div>
                        <span className="product-rating">
                          <FiStar className="star-filled" /> {product.rating || '—'}
                        </span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm add-cart-btn"
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        <FiShoppingCart /> Add to Cart
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="features-section">
          <div className="feature-card">
            <div className="feature-icon"><FiTruck /></div>
            <h3>Free Shipping</h3>
            <p>On orders over ₹500</p>
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

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
