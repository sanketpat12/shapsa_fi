import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import products from '../../data/products';
import { FiAlertTriangle, FiEdit2, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import './Inventory.css';

export default function Inventory() {
  const { user } = useAuth();
  const retailerId = user.id === 3 ? 1 : 2;
  const myProducts = products.filter(p => p.retailerId === retailerId);

  const [inventoryData, setInventoryData] = useState(
    myProducts.map(p => ({ ...p }))
  );
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const LOW_STOCK_THRESHOLD = 10;
  const CRITICAL_THRESHOLD = 5;

  const lowStockCount = inventoryData.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
  const criticalCount = inventoryData.filter(p => p.stock <= CRITICAL_THRESHOLD).length;

  const filteredProducts = inventoryData.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'low') return matchesSearch && p.stock <= LOW_STOCK_THRESHOLD && p.stock > CRITICAL_THRESHOLD;
    if (filter === 'critical') return matchesSearch && p.stock <= CRITICAL_THRESHOLD;
    if (filter === 'healthy') return matchesSearch && p.stock > LOW_STOCK_THRESHOLD;
    return matchesSearch;
  });

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditStock(product.stock.toString());
  };

  const handleSave = (productId) => {
    setInventoryData(prev =>
      prev.map(p => p.id === productId ? { ...p, stock: parseInt(editStock) } : p)
    );
    setEditingId(null);
    setToast('Stock updated successfully!');
    setTimeout(() => setToast(null), 2000);
  };

  const getStockStatus = (stock) => {
    if (stock <= CRITICAL_THRESHOLD) return { label: 'Critical', class: 'badge-danger' };
    if (stock <= LOW_STOCK_THRESHOLD) return { label: 'Low Stock', class: 'badge-warning' };
    return { label: 'In Stock', class: 'badge-success' };
  };

  const getStockBarWidth = (stock) => Math.min((stock / 100) * 100, 100);
  const getStockBarColor = (stock) => {
    if (stock <= CRITICAL_THRESHOLD) return 'var(--danger)';
    if (stock <= LOW_STOCK_THRESHOLD) return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="inventory-page page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Monitor and manage your stock levels</p>
        </div>
      </div>

      {/* Alert Banners */}
      {criticalCount > 0 && (
        <div className="alert alert-danger">
          <FiAlertTriangle /> <strong>Critical:</strong> {criticalCount} product{criticalCount > 1 ? 's' : ''} at critically low stock (≤{CRITICAL_THRESHOLD} units). Immediate restock required!
        </div>
      )}
      {lowStockCount > criticalCount && (
        <div className="alert alert-warning">
          <FiAlertTriangle /> <strong>Warning:</strong> {lowStockCount - criticalCount} product{(lowStockCount - criticalCount) > 1 ? 's' : ''} running low on stock (≤{LOW_STOCK_THRESHOLD} units).
        </div>
      )}

      {/* Stats Bar */}
      <div className="inventory-stats">
        <div className="inv-stat" onClick={() => setFilter('all')}>
          <span className="inv-stat-value">{inventoryData.length}</span>
          <span className="inv-stat-label">Total Products</span>
        </div>
        <div className="inv-stat healthy" onClick={() => setFilter('healthy')}>
          <span className="inv-stat-value">{inventoryData.filter(p => p.stock > LOW_STOCK_THRESHOLD).length}</span>
          <span className="inv-stat-label">Healthy Stock</span>
        </div>
        <div className="inv-stat low" onClick={() => setFilter('low')}>
          <span className="inv-stat-value">{inventoryData.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.stock > CRITICAL_THRESHOLD).length}</span>
          <span className="inv-stat-label">Low Stock</span>
        </div>
        <div className="inv-stat critical" onClick={() => setFilter('critical')}>
          <span className="inv-stat-value">{criticalCount}</span>
          <span className="inv-stat-label">Critical</span>
        </div>
      </div>

      {/* Filters */}
      <div className="inventory-controls">
        <div className="search-box" style={{ maxWidth: 300 }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {['all', 'healthy', 'low', 'critical'].map(f => (
            <button
              key={f}
              className={`category-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => {
              const status = getStockStatus(product.stock);
              return (
                <tr key={product.id} className={product.stock <= CRITICAL_THRESHOLD ? 'critical-row' : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={product.image} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      <span style={{ fontWeight: 600 }}>{product.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{product.category}</span></td>
                  <td style={{ fontWeight: 700 }}>${product.price}</td>
                  <td>
                    <div className="stock-cell">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          className="stock-edit-input"
                          value={editStock}
                          onChange={e => setEditStock(e.target.value)}
                          min="0"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="stock-number">{product.stock} units</span>
                          <div className="stock-bar">
                            <div
                              className="stock-bar-fill"
                              style={{
                                width: `${getStockBarWidth(product.stock)}%`,
                                background: getStockBarColor(product.stock)
                              }}
                            ></div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td><span className={`badge ${status.class}`}>{status.label}</span></td>
                  <td>
                    {editingId === product.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }} onClick={() => handleSave(product.id)}><FiCheck /></button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => setEditingId(null)}><FiX /></button>
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(product)}>
                        <FiEdit2 /> Update
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
