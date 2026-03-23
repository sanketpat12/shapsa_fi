import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import products from '../../data/products';
import { FiShoppingCart, FiStar, FiZap } from 'react-icons/fi';
import './Products.css';

export default function Deals() {
  const { addToCart } = useAuth();
  const [toast, setToast] = useState(null);

  const dealProducts = products.map(p => ({
    ...p,
    originalPrice: p.price,
    price: Math.round(p.price * 0.75),
    discount: 25
  })).slice(0, 8);

  const handleAddToCart = (product) => {
    addToCart(product);
    setToast(`${product.name} added to cart!`);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔥 Hot Deals</h1>
          <p className="page-subtitle">Limited time offers — up to 25% off!</p>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px',
        color: 'white',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 20
      }}>
        <FiZap style={{ fontSize: '2.5rem' }} />
        <div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 4 }}>Flash Sale — 25% Off Everything!</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>Don't miss out on these incredible deals. Offer ends soon.</p>
        </div>
      </div>

      <div className="products-grid">
        {dealProducts.map((product, i) => (
          <div
            key={product.id}
            className="product-card"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="product-badge" style={{ background: 'var(--danger)' }}>
              {product.discount}% OFF
            </span>
            <div className="product-img-container">
              <img src={product.image} alt={product.name} className="product-img" />
            </div>
            <div className="product-info">
              <span className="product-category">{product.category}</span>
              <h3 className="product-name">{product.name}</h3>
              <div className="product-meta">
                <div>
                  <span className="product-price">${product.price}</span>
                  <span style={{
                    textDecoration: 'line-through',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginLeft: 8
                  }}>
                    ${product.originalPrice}
                  </span>
                </div>
                <span className="product-rating">
                  <FiStar className="star-filled" /> {product.rating}
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm add-cart-btn"
                onClick={() => handleAddToCart(product)}
              >
                <FiShoppingCart /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
