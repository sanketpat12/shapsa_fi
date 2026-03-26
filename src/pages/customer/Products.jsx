import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiSearch, FiShoppingCart, FiStar, FiFilter, FiX, FiCheckCircle } from 'react-icons/fi';
import './Products.css';

const CATEGORIES = ['All', 'Phones', 'Laptops', 'Audio', 'Wearables', 'Tablets', 'Gaming', 'Camera', 'Smart Home', 'Accessories', 'Food', 'Snacks', 'Handcraft', 'Groceries', 'Clothing'];

export default function Products() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('featured');
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const MOCK_REVIEWS = [
    { id: 1, user: "Alex M.", rating: 5, text: "Absolutely love this product! Highly recommended.", date: "2 days ago" },
    { id: 2, user: "Sarah J.", rating: 4, text: "Good quality, but shipping took a little longer than expected.", date: "1 week ago" },
    { id: 3, user: "Michael T.", rating: 5, text: "Exceeded my expectations. Great value for the price.", date: "2 weeks ago" }
  ];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, addToCart, cart } = useAuth();

  // Sync state with URL params if they change dynamically
  useEffect(() => {
    const customSearch = searchParams.get('search');
    if (customSearch !== null) setSearchQuery(customSearch);
  }, [searchParams]);

  // Fetch products from Supabase whenever category changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from('products').select('*');

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      if (!error) setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, [selectedCategory]);

  // Client-side search + sort on top of the fetched products
  const filteredProducts = (() => {
    let filtered = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: break;
    }

    return filtered;
  })();

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();
    if (!product.stock || product.stock <= 0) {
      setToast(`❌ ${product.name} is out of stock!`);
      setTimeout(() => setToast(null), 2500);
      return;
    }
    // Check how many already in cart
    const inCart = cart.find(i => i.id === product.id);
    if (inCart && inCart.quantity >= product.stock) {
      setToast(`❌ Only ${product.stock} unit${product.stock > 1 ? 's' : ''} available!`);
      setTimeout(() => setToast(null), 2500);
      return;
    }
    addToCart(product);
    setToast(`✅ ${product.name} added to cart!`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleBuyNow = async (product, e) => {
    if (e) e.stopPropagation();
    if (!user) return alert('Please log in to purchase');
    
    const subtotal = product.price; 
    const totalWithTax = subtotal * 1.08;

    let finalRetailerId = product.retailer_id;
    
    // Fallback for mock/dummy products: find a real retailer who has added products
    if (!finalRetailerId || finalRetailerId.toString().length < 20) {
      const { data: realProds } = await supabase.from('products').select('retailer_id').not('retailer_id', 'is', null).neq('retailer_id', 1).neq('retailer_id', 2).limit(1);
      if (realProds && realProds.length > 0 && realProds[0].retailer_id.length > 20) {
        finalRetailerId = realProds[0].retailer_id;
      } else {
        return alert("Demo Mode Checkout Failed: No real Retailer accounts found. Please log in as a Retailer, add a new product, and try buying that one!");
      }
    }

    const orderToInsert = {
      customer_id: user.id,
      retailer_id: finalRetailerId,
      items: [{
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      }],
      total_price: Number(totalWithTax.toFixed(2)),
      status: 'Pending'
    };

    // Validate stock before buying
    const { data: stockData } = await supabase.from('products').select('stock').eq('id', product.id).single();
    if (stockData && stockData.stock <= 0) {
      alert('Sorry, this product is out of stock!');
      return;
    }

    const { error } = await supabase.from('orders').insert([orderToInsert]);
    
    if (error) {
      console.error('Buy Now error:', error);
      alert('Failed to place order: ' + error.message);
    } else {
      // Decrement stock via secure RPC
      await supabase.rpc('decrement_stock', { product_id: product.id, qty: 1 });
      // Save customer profile for retailer
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        role: user.role || 'customer',
      }, { onConflict: 'id' });

      setToast(`✅ Order placed successfully!`);
      setTimeout(() => setToast(null), 3000);
      setSelectedProduct(null); // Close modal
    }
  };

  return (
    <div className="products-page page-container animate-fade-in">
      <div className="products-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${filteredProducts.length} products found`}
          </p>
        </div>
        <div className="products-controls">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="categories-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p>Loading products…</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product, i) => (
            <div
              key={product.id}
              className="product-card"
              style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
              onClick={() => setSelectedProduct(product)}
            >
              {product.badge && <span className="product-badge">{product.badge}</span>}
              {product.stock === 0 && <span className="product-badge" style={{ background: '#ef4444' }}>Out of Stock</span>}
              <div className="product-img-container">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="product-img" style={{ opacity: product.stock === 0 ? 0.5 : 1 }} />
                ) : (
                  <div className="product-img" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 48, background: 'var(--bg-secondary)'
                  }}>
                    📦
                  </div>
                )}
                <button
                  className="quick-add-btn"
                  onClick={(e) => handleAddToCart(product, e)}
                  title={product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  disabled={product.stock === 0}
                >
                  <FiShoppingCart />
                </button>
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-desc">
                  {product.description ? product.description.substring(0, 60) + '…' : ''}
                </p>
                <div className="product-meta">
                  <span className="product-price">₹{product.price}</span>
                  <span className="product-rating">
                    <FiStar className="star-filled" /> {product.rating || '—'}
                  </span>
                </div>
                {product.stock > 0 && product.stock <= 5 && (
                  <p style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, margin: '4px 0 0' }}>Only {product.stock} left!</p>
                )}
                <button
                  className="btn btn-primary btn-sm add-cart-btn"
                  onClick={(e) => handleAddToCart(product, e)}
                  disabled={product.stock === 0}
                  style={{ opacity: product.stock === 0 ? 0.5 : 1, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <FiShoppingCart /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
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
                <span className="product-category" style={{ display: 'inline-block', marginBottom: 12, padding: '4px 12px', background: 'var(--accent-light)', color: 'var(--primary)', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {selectedProduct.category}
                </span>
                <h2 style={{ fontSize: '2.5rem', margin: '0 0 12px 0', color: 'var(--text-dark)', lineHeight: 1.1, fontWeight: 800 }}>{selectedProduct.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{selectedProduct.price}</span>
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
                  onClick={(e) => handleBuyNow(selectedProduct, e)}
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
