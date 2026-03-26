import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { categoryKeywords } from '../../data/products';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiCpu, FiTag, FiCheck } from 'react-icons/fi';
import './AddProduct.css';

const CATEGORIES = ['Phones', 'Laptops', 'Audio', 'Wearables', 'Tablets', 'Gaming', 'Camera', 'Smart Home', 'Accessories', 'Food', 'Snacks', 'Handcraft', 'Groceries', 'Clothing'];

const categoryEmojis = {
  'Audio': '🎧', 'Phones': '📱', 'Laptops': '💻', 'Wearables': '⌚',
  'Gaming': '🎮', 'Camera': '📷', 'Tablets': '📟', 'Smart Home': '🏠',
  'Accessories': '🔌', 'Food': '🍔', 'Snacks': '🍿', 'Handcraft': '🎨',
  'Groceries': '🛒', 'Clothing': '👕'
};

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

  const [myProducts, setMyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '', price: '', category: 'Phones', description: '', stock: '', imageFile: null
  });

  // AI Detection state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRan, setAiRan] = useState(false);
  const [selectedAiCat, setSelectedAiCat] = useState(null);
  const debounceRef = useRef(null);

  // Fetch this retailer's products from Supabase
  const fetchMyProducts = async () => {
    if (!user?.id) return;
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('retailer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setMyProducts(data || []);
    setLoadingProducts(false);
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user?.id]);

  // AI category detection
  useEffect(() => {
    if (!form.name && !form.description) {
      setAiSuggestions([]);
      setAiRan(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAiLoading(true);
      setTimeout(() => {
        const suggestions = detectCategories(form.name, form.description);
        setAiSuggestions(suggestions);
        setAiLoading(false);
        setAiRan(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);

    let imageUrl = null;

    // Upload image to Supabase Storage if a file was selected
    if (form.imageFile) {
      const fileExt = form.imageFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, form.imageFile);

      if (uploadError) {
        setToast('❌ Failed to upload image: ' + uploadError.message);
        setSaving(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
        
      imageUrl = publicUrl;
    }

    const { error } = await supabase.from('products').insert({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      description: form.description,
      stock: parseInt(form.stock, 10),
      image: imageUrl,
      rating: 0,
      retailer_id: user.id,
    });

    if (error) {
      setToast('❌ Failed to add product: ' + error.message);
    } else {
      setToast('✅ Product added successfully!');
      setShowForm(false);
      setForm({ name: '', price: '', category: 'Phones', description: '', stock: '', imageFile: null });
      setAiSuggestions([]);
      setAiRan(false);
      setSelectedAiCat(null);
      await fetchMyProducts();
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setMyProducts(prev => prev.filter(p => p.id !== productId));
      setToast('Product removed.');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'category') setSelectedAiCat(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm(prev => ({ ...prev, imageFile: e.target.files[0] }));
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Products</h1>
          <p className="page-subtitle">
            {loadingProducts ? 'Loading…' : `${myProducts.length} products listed`}
          </p>
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
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" className="form-input" placeholder="e.g., ProAudio X1 Headphones"
                  value={form.name} onChange={e => handleFormChange('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" className="form-input" placeholder="e.g., 299" min="0" step="0.01"
                  value={form.price} onChange={e => handleFormChange('price', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" className="form-input" placeholder="e.g., 50" min="0"
                  value={form.stock} onChange={e => handleFormChange('stock', e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Description <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(helps AI detect category)</span></label>
              <textarea className="form-input" placeholder="Describe your product..."
                value={form.description} onChange={e => handleFormChange('description', e.target.value)} rows={3} required />
            </div>

            {/* AI Category Panel */}
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
                  <div className="ai-analyzing-dots"><span /><span /><span /></div>
                  <span>Analyzing product details...</span>
                </div>
              )}
              {aiRan && !aiLoading && (
                <>
                  {aiSuggestions.length === 0 ? (
                    <div className="ai-no-match">🤔 Couldn't detect category automatically. Please select manually below.</div>
                  ) : (
                    <div className="ai-suggestions">
                      {aiSuggestions.map((s, i) => (
                        <button type="button" key={s.category}
                          className={`ai-suggestion-chip ${form.category === s.category ? 'selected' : ''} ${i === 0 ? 'top-pick' : ''}`}
                          onClick={() => handleAiCatSelect(s.category)}>
                          <span className="ai-chip-emoji">{categoryEmojis[s.category] || '📦'}</span>
                          <div className="ai-chip-info">
                            <span className="ai-chip-name">{s.category}</span>
                            <div className="ai-confidence-bar">
                              <div className="ai-confidence-fill" style={{ width: `${s.confidence}%` }} />
                            </div>
                            <span className="ai-chip-conf">{s.confidence}% match</span>
                          </div>
                          {i === 0 && <span className="ai-top-badge">Top Pick</span>}
                          {form.category === s.category && <FiCheck className="ai-chip-check" />}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="ai-divider"><span>or select manually</span></div>
              <div className="manual-category-section">
                <label className="form-label-small"><FiTag /> Manual Category</label>
                <div className="manual-category-grid">
                  {CATEGORIES.map(cat => (
                    <button type="button" key={cat}
                      className={`manual-cat-btn ${form.category === cat ? 'active' : ''}`}
                      onClick={() => handleFormChange('category', cat)}>
                      <span>{categoryEmojis[cat] || '📦'}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Product Image</label>
              <div className="image-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiImage style={{ color: 'var(--text-muted)' }} />
                  <input type="file" accept="image/*" className="form-input" style={{ padding: '8px' }}
                    onChange={handleImageChange} />
                </div>
                {form.imageFile && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Selected: {form.imageFile.name}
                  </span>
                )}
              </div>
            </div>

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
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : <><FiPlus /> Add Product</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading products…</div>
        ) : myProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <h3>No products yet</h3>
            <p>Click <strong>Add Product</strong> to list your first product.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name}
                          style={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          {categoryEmojis[product.category] || '📦'}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{product.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{product.category}</span></td>
                  <td style={{ fontWeight: 700 }}>₹{product.price}</td>
                  <td>
                    <span className={`badge ${product.stock <= 5 ? 'badge-danger' : product.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                        onClick={() => handleDelete(product.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
