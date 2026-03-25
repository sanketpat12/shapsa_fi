import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import products from '../../data/products';
import { FiAlertTriangle, FiEdit2, FiCheck, FiX, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [toast, setToast] = useState(null);

  const LOW_STOCK_THRESHOLD = 10;
  const CRITICAL_THRESHOLD = 5;

  const lowStockCount = inventoryData.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
  const criticalCount = inventoryData.filter(p => p.stock <= CRITICAL_THRESHOLD).length;

  // All unique categories for this retailer
  const allCategories = useMemo(() => {
    const cats = [...new Set(inventoryData.map(p => p.category))].sort();
    return cats;
  }, [inventoryData]);

  const filteredProducts = inventoryData.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    if (statusFilter === 'low') return matchesSearch && matchesCategory && p.stock <= LOW_STOCK_THRESHOLD && p.stock > CRITICAL_THRESHOLD;
    if (statusFilter === 'critical') return matchesSearch && matchesCategory && p.stock <= CRITICAL_THRESHOLD;
    if (statusFilter === 'healthy') return matchesSearch && matchesCategory && p.stock > LOW_STOCK_THRESHOLD;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const cat = product.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  const toggleCategory = (cat) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

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

  const categoryEmojis = {
    'Audio': '🎧', 'Phones': '📱', 'Laptops': '💻', 'Wearables': '⌚',
    'Gaming': '🎮', 'Camera': '📷', 'Tablets': '📟', 'Smart Home': '🏠',
    'Accessories': '🔌'
  };

  return (
    <div className="inventory-page page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Monitor and manage your stock levels by category</p>
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
        <div className="inv-stat" onClick={() => setStatusFilter('all')}>
          <span className="inv-stat-value">{inventoryData.length}</span>
          <span className="inv-stat-label">Total Products</span>
        </div>
        <div className="inv-stat healthy" onClick={() => setStatusFilter('healthy')}>
          <span className="inv-stat-value">{inventoryData.filter(p => p.stock > LOW_STOCK_THRESHOLD).length}</span>
          <span className="inv-stat-label">Healthy Stock</span>
        </div>
        <div className="inv-stat low" onClick={() => setStatusFilter('low')}>
          <span className="inv-stat-value">{inventoryData.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.stock > CRITICAL_THRESHOLD).length}</span>
          <span className="inv-stat-label">Low Stock</span>
        </div>
        <div className="inv-stat critical" onClick={() => setStatusFilter('critical')}>
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
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Status:</span>
          {['all', 'healthy', 'low', 'critical'].map(f => (
            <button
              key={f}
              className={`category-btn ${statusFilter === f ? 'active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="category-filter-row">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Category:</span>
        <button
          className={`category-btn ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All Categories
        </button>
        {allCategories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {categoryEmojis[cat] || '📦'} {cat}
          </button>
        ))}
      </div>

      {/* Inventory grouped by Category */}
      {Object.keys(groupedProducts).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category} className="inventory-category-section">
            <button
              className="inventory-category-header"
              onClick={() => toggleCategory(category)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="category-header-emoji">{categoryEmojis[category] || '📦'}</span>
                <span className="category-header-name">{category}</span>
                <span className="category-header-count">{categoryProducts.length} item{categoryProducts.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {categoryProducts.some(p => p.stock <= CRITICAL_THRESHOLD) && (
                  <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>Critical Stock</span>
                )}
                {!categoryProducts.some(p => p.stock <= CRITICAL_THRESHOLD) &&
                  categoryProducts.some(p => p.stock <= LOW_STOCK_THRESHOLD) && (
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Low Stock</span>
                )}
                {collapsedCategories[category] ? <FiChevronDown /> : <FiChevronUp />}
              </div>
            </button>

            {!collapsedCategories[category] && (
              <div className="table-container" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Stock Level</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryProducts.map(product => {
                      const status = getStockStatus(product.stock);
                      return (
                        <tr key={product.id} className={product.stock <= CRITICAL_THRESHOLD ? 'critical-row' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <img src={product.image} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                              <span style={{ fontWeight: 600 }}>{product.name}</span>
                            </div>
                          </td>
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
            )}
          </div>
        ))
      )}

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
