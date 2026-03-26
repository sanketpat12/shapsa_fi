import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiShoppingCart, FiStar, FiZap, FiRefreshCw, FiX, FiCheckCircle } from 'react-icons/fi';
import './Products.css';

export default function Deals() {
  const { addToCart } = useAuth();
  const [toast, setToast] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const MOCK_REVIEWS = [
    { id: 1, user: "Alex M.", rating: 5, text: "Absolutely love this product! Highly recommended.", date: "2 days ago" },
    { id: 2, user: "Sarah J.", rating: 4, text: "Good quality, but shipping took a little longer than expected.", date: "1 week ago" },
    { id: 3, user: "Michael T.", rating: 5, text: "Exceeded my expectations. Great value for the price.", date: "2 weeks ago" }
  ];

  const fetchDeals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('deal_active', true)
      .gt('discount', 0)
      .order('discount', { ascending: false });
    setDeals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeals();

    // Real-time: update deals whenever a product is updated
    const channel = supabase
      .channel('deals-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const p = payload.new;
          if (p.deal_active && p.discount > 0) {
            setDeals(prev => {
              const exists = prev.find(d => d.id === p.id);
              return exists ? prev.map(d => d.id === p.id ? p : d) : [p, ...prev];
            });
          } else {
            setDeals(prev => prev.filter(d => d.id !== p.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setDeals(prev => prev.filter(d => d.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleAddToCart = (product) => {
    const discountedProduct = {
      ...product,
      originalPrice: product.price,
      price: Math.round(product.price * (1 - product.discount / 100))
    };
    addToCart(discountedProduct);
    setToast(`✅ ${product.name} added to cart!`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleBuyNow = async (product, e) => {
    if (e) e.stopPropagation();
    const discountedPrice = Math.round(product.price * (1 - product.discount / 100));
    handleAddToCart({ ...product, price: discountedPrice });
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔥 Hot Deals</h1>
          <p className="page-subtitle">Exclusive retailer discounts — updated in real-time!</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchDeals} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Hero Banner */}
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
        <FiZap style={{ fontSize: '2.5rem', flexShrink: 0 }} />
        <div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 4 }}>
            Live Retailer Deals — Up to {deals.length > 0 ? Math.max(...deals.map(d => d.discount)) : 50}% Off!
          </h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
            {deals.length > 0
              ? `${deals.length} deal${deals.length > 1 ? 's' : ''} currently active. Prices update in real time!`
              : 'New deals are posted by retailers frequently. Check back soon!'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
          <h3>Loading Deals…</h3>
          <p>Fetching the latest offers for you.</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏷️</div>
          <h3>No active deals right now</h3>
          <p>Retailers haven't posted any discounts yet. Come back later for amazing offers!</p>
        </div>
      ) : (
        <div className="products-grid">
          {deals.map((product, i) => {
            const discountedPrice = Math.round(product.price * (1 - product.discount / 100));
            return (
              <div
                key={product.id}
                className="product-card"
                style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                onClick={() => setSelectedProduct(product)}
              >
                <span className="product-badge" style={{ background: 'var(--danger)' }}>
                  {product.discount}% OFF
                </span>
                {product.deal_label && (
                  <span style={{
                    position: 'absolute', top: 44, right: 12,
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: 20, letterSpacing: '0.5px', zIndex: 2
                  }}>
                    {product.deal_label.toUpperCase()}
                  </span>
                )}
                <div className="product-img-container">
                  <img src={product.image} alt={product.name} className="product-img" />
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-meta">
                    <div>
                      <span className="product-price">₹{discountedPrice.toLocaleString()}</span>
                      <span style={{
                        textDecoration: 'line-through',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        marginLeft: 8
                      }}>
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>
                    <span className="product-rating">
                      <FiStar className="star-filled" /> {product.rating || '4.5'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600, marginBottom: 8 }}>
                    💰 Save ₹{(product.price - discountedPrice).toLocaleString()}
                  </div>
                  <button
                    className="btn btn-primary btn-sm add-cart-btn"
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                  >
                    <FiShoppingCart /> Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content animate-fade-in-up" onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-white)', borderRadius: '24px', 
            maxWidth: 900, width: '100%', maxHeight: '90vh', overflowY: 'auto',
            position: 'relative', display: 'flex', flexDirection: 'row', boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
          }}>
            <button onClick={() => setSelectedProduct(null)} style={{
              position: 'absolute', top: 20, right: 20, background: 'var(--bg-secondary)', 
              border: 'none', width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10, transition: 'all 0.2s', color: 'var(--text-dark)'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              <FiX size={24} />
            </button>
            
            <div className="modal-image-col" style={{ flex: '1 1 40%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} style={{
                  width: '100%', height: 'auto', maxHeight: '60vh', objectFit: 'contain', 
                  borderRadius: '12px', mixBlendMode: 'darken'
                }} />
              ) : (
                <div style={{ fontSize: 100 }}>📦</div>
              )}
            </div>

            <div className="modal-info-col" style={{ flex: '1 1 60%', padding: '40px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 24 }}>
                <span className="product-category" style={{ display: 'inline-block', marginBottom: 12, padding: '4px 12px', background: 'var(--danger)', color: 'white', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {selectedProduct.discount}% OFF DEAL
                </span>
                <h2 style={{ fontSize: '2.5rem', margin: '0 0 12px 0', color: 'var(--text-dark)', lineHeight: 1.1, fontWeight: 800 }}>{selectedProduct.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{Math.round(selectedProduct.price * (1 - selectedProduct.discount / 100))}</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>₹{selectedProduct.price}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontWeight: 600, fontSize: '1.1rem' }}>
                    <FiStar className="star-filled" /> {selectedProduct.rating || '4.8'} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>(124 reviews)</span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                <p style={{ color: 'var(--text-body)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>{selectedProduct.description || 'No description available for this product. High quality materials and exceptional design make this a perfect choice.'}</p>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                    <FiCheckCircle color={selectedProduct.stock > 0 ? 'var(--success)' : '#ef4444'} size={20} />
                    <span style={{ color: selectedProduct.stock > 0 ? 'var(--success)' : '#ef4444' }}>
                      {selectedProduct.stock > 0 ? `In stock — ${selectedProduct.stock} unit${selectedProduct.stock > 1 ? 's' : ''} available` : 'Out of Stock'}
                    </span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-body)' }}><FiCheckCircle color="var(--primary)" size={20} /> Free shipping on orders over ₹500</li>
                </ul>
              </div>

              <div style={{ padding: '24px 0', flex: 1 }}>
                <h3 style={{ fontSize: '1.3rem', margin: '0 0 20px 0', fontWeight: 700 }}>Customer Reviews</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {MOCK_REVIEWS.slice(0,2).map(review => (
                    <div key={review.id} style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{review.user}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{review.date}</span>
                      </div>
                      <div style={{ color: '#f59e0b', marginBottom: 10, display: 'flex', gap: 2 }}>
                        {[...Array(5)].map((_, i) => <FiStar key={i} fill={i < review.rating ? 'currentColor' : 'none'} color={i < review.rating ? 'currentColor' : 'var(--border)'} size={14} />)}
                      </div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>"{review.text}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 'auto', paddingTop: 20 }}>
                <button 
                  className="btn btn-secondary btn-lg" 
                  style={{ flex: 1, padding: '16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, background: selectedProduct.stock === 0 ? 'var(--bg-secondary)' : 'var(--accent-light)', color: selectedProduct.stock === 0 ? 'var(--text-muted)' : 'var(--primary)', border: 'none', opacity: selectedProduct.stock === 0 ? 0.6 : 1, cursor: selectedProduct.stock === 0 ? 'not-allowed' : 'pointer' }}
                  onClick={(e) => handleAddToCart(selectedProduct, e)}
                  disabled={selectedProduct.stock === 0}
                >
                  <FiShoppingCart /> {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button 
                  className="btn btn-primary btn-lg" 
                  style={{ flex: 1, padding: '16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: selectedProduct.stock === 0 ? 0.6 : 1, cursor: selectedProduct.stock === 0 ? 'not-allowed' : 'pointer' }}
                  onClick={(e) => { handleBuyNow(selectedProduct, e); setSelectedProduct(null); }}
                  disabled={selectedProduct.stock === 0}
                >
                  {selectedProduct.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
