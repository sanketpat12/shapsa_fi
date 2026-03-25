import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import products, { categoryKeywords } from '../../data/products';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiCpu, FiTag, FiCheck } from 'react-icons/fi';
import './AddProduct.css';

const CATEGORIES = ['Phones', 'Laptops', 'Audio', 'Wearables', 'Tablets', 'Gaming', 'Camera', 'Smart Home', 'Accessories'];

const categoryEmojis = {
  'Audio': '🎧', 'Phones': '📱', 'Laptops': '💻', 'Wearables': '⌚',
  'Gaming': '🎮', 'Camera': '📷', 'Tablets': '📟', 'Smart Home': '🏠',
  'Accessories': '🔌'
};

// Simulated AI category detection (keyword-based; can be replaced with actual AI call)
function detectCategories(name, description) {
  const text = (name + ' ' + description).toLowerCase();
  const scores = {};
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += kw.split(' ').length > 1 ? 2 : 1;
    }
    if (score > 0) scores[category] = score;
  }
  // Sort by score desc, return top 3
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, score]) => ({
      category: cat,
      confidence: Math.min(Math.round((score / 6) * 100), 99)
    }));
}

export default function AddProduct() {
  const { user } = useAuth();
  const retailerId = user.id === 3 ? 1 : 2;
  const myProducts = products.filter(p => p.retailerId === retailerId);

  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Phones',
    description: '',
    stock: '',
    image: ''
  });

  // AI Detection state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRan, setAiRan] = useState(false);
  const [selectedAiCat, setSelectedAiCat] = useState(null);
  const debounceRef = useRef(null);

  // Trigger AI detection when name or description changes
  useEffect(() => {
    if (!form.name && !form.description) {
      setAiSuggestions([]);
      setAiRan(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAiLoading(true);
      // Simulate slight delay like an API call
      setTimeout(() => {
        const suggestions = detectCategories(form.name, form.description);
        setAiSuggestions(suggestions);
        setAiLoading(false);
        setAiRan(true);
        // Auto-pick top suggestion if confidence > 40
        if (suggestions.length > 0 && suggestions[0].confidence > 40) {
          setForm(prev => ({ ...prev, category: suggestions[0].category }));
          setSelectedAiCat(suggestions[0].category);
        }
      }, 600);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [form.name, form.description]);

  const handleAiCatSelect = (cat) => {
    setForm(prev => ({ ...prev, category: cat }));
    setSelectedAiCat(cat);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast('Product added successfully!');
    setShowForm(false);
    setForm({ name: '', price: '', category: 'Phones', description: '', stock: '', image: '' });
    setAiSuggestions([]);
    setAiRan(false);
    setSelectedAiCat(null);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Reset AI selection if user manually picks category
    if (field === 'category') setSelectedAiCat(null);
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Products</h1>
          <p className="page-subtitle">{myProducts.length} products listed</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="add-product-form card animate-fade-in-up" style={{ marginBottom: 32 }}>
          <div className="add-product-form-header">
            <h3>Add New Product</h3>
            <span className="ai-powered-badge"><FiCpu /> AI Powered</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Product Name */}
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., ProAudio X1 Headphones"
                  value={form.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Price */}
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 299"
                  value={form.price}
                  onChange={e => handleFormChange('price', e.target.value)}
                  required
                />
              </div>

              {/* Stock */}
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 50"
                  value={form.stock}
                  onChange={e => handleFormChange('stock', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(helps AI detect category)</span></label>
              <textarea
                className="form-input"
                placeholder="Describe your product... e.g., Wireless over-ear headphones with ANC and 40hr battery..."
                value={form.description}
                onChange={e => handleFormChange('description', e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* ── AI CATEGORY PANEL ── */}
            <div className="ai-category-panel">
              <div className="ai-panel-header">
                <div className="ai-panel-title">
                  <span className="ai-orb">🤖</span>
                  <span>AI Category Suggestion</span>
                  {aiLoading && <span className="ai-spinner" />}
                </div>
                <span className="ai-panel-hint">Based on your product name & description</span>
              </div>

              {!aiRan && !aiLoading && (
                <div className="ai-panel-placeholder">
                  Start typing the product name or description to get AI-powered category suggestions
                </div>
              )}

              {aiLoading && (
                <div className="ai-analyzing">
                  <div className="ai-analyzing-dots">
                    <span /><span /><span />
                  </div>
                  <span>Analyzing product details...</span>
                </div>
              )}

              {aiRan && !aiLoading && (
                <>
                  {aiSuggestions.length === 0 ? (
                    <div className="ai-no-match">
                      🤔 Couldn't detect category automatically. Please select manually below.
                    </div>
                  ) : (
                    <div className="ai-suggestions">
                      {aiSuggestions.map((s, i) => (
                        <button
                          type="button"
                          key={s.category}
                          className={`ai-suggestion-chip ${form.category === s.category ? 'selected' : ''} ${i === 0 ? 'top-pick' : ''}`}
                          onClick={() => handleAiCatSelect(s.category)}
                        >
                          <span className="ai-chip-emoji">{categoryEmojis[s.category] || '📦'}</span>
                          <div className="ai-chip-info">
                            <span className="ai-chip-name">{s.category}</span>
                            <div className="ai-confidence-bar">
                              <div className="ai-confidence-fill" style={{ width: `${s.confidence}%` }} />
                            </div>
                            <span className="ai-chip-conf">{s.confidence}% match</span>
                          </div>
                          {i === 0 && <span className="ai-top-badge">Top Pick</span>}
                          {form.category === s.category && (
                            <FiCheck className="ai-chip-check" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Divider */}
              <div className="ai-divider">
                <span>or select manually</span>
              </div>

              {/* Manual Category Select */}
              <div className="manual-category-section">
                <label className="form-label-small"><FiTag /> Manual Category</label>
                <div className="manual-category-grid">
                  {CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      className={`manual-cat-btn ${form.category === cat ? 'active' : ''}`}
                      onClick={() => handleFormChange('category', cat)}
                    >
                      <span>{categoryEmojis[cat] || '📦'}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Image URL</label>
              <div className="image-input-group">
                <FiImage style={{ color: 'var(--text-muted)' }} />
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={e => handleFormChange('image', e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="add-product-form-footer">
              <div className="selected-category-preview">
                <span>Selected Category:</span>
                <span className="selected-cat-chip">
                  {categoryEmojis[form.category] || '📦'} {form.category}
                  {selectedAiCat === form.category && <span className="ai-selected-tag">🤖 AI</span>}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiPlus /> Add Product</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myProducts.map(product => (
              <tr key={product.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 600 }}>{product.name}</span>
                  </div>
                </td>
                <td><span className="badge badge-primary">{product.category}</span></td>
                <td style={{ fontWeight: 700 }}>${product.price}</td>
                <td>
                  <span className={`badge ${product.stock <= 5 ? 'badge-danger' : product.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                    {product.stock} units
                  </span>
                </td>
                <td>⭐ {product.rating}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm"><FiEdit2 /></button>
                    <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
