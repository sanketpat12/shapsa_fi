import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import products from '../../data/products';
import { FiPlus, FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import './AddProduct.css';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast('Product added successfully!');
    setShowForm(false);
    setForm({ name: '', price: '', category: 'Phones', description: '', stock: '', image: '' });
    setTimeout(() => setToast(null), 3000);
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
          <h3 style={{ marginBottom: 24 }}>Add New Product</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., ProAudio X1"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 299"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option>Phones</option>
                  <option>Laptops</option>
                  <option>Audio</option>
                  <option>Wearables</option>
                  <option>Tablets</option>
                  <option>Gaming</option>
                  <option>Camera</option>
                  <option>Smart Home</option>
                  <option>Accessories</option>
                </select>
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 50"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-input"
                placeholder="Describe your product..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <div className="image-input-group">
                <FiImage style={{ color: 'var(--text-muted)' }} />
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Product</button>
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
