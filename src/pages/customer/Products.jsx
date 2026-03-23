import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import products, { categories } from '../../data/products';
import { FiSearch, FiShoppingCart, FiStar, FiFilter } from 'react-icons/fi';
import './Products.css';

export default function Products() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [toast, setToast] = useState(null);
  const { addToCart } = useAuth();

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = (product) => {
    addToCart(product);
    setToast(`${product.name} added to cart!`);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="products-page page-container animate-fade-in">
      <div className="products-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{filteredProducts.length} products found</p>
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
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="categories-filter">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
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
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {product.badge && (
                <span className="product-badge">{product.badge}</span>
              )}
              <div className="product-img-container">
                <img src={product.image} alt={product.name} className="product-img" />
                <button
                  className="quick-add-btn"
                  onClick={() => handleAddToCart(product)}
                  title="Add to Cart"
                >
                  <FiShoppingCart />
                </button>
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-desc">{product.description.substring(0, 60)}...</p>
                <div className="product-meta">
                  <span className="product-price">${product.price}</span>
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
      )}

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
