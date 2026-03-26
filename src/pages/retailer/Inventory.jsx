import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  FiAlertTriangle, FiEdit2, FiCheck, FiX, FiSearch,
  FiChevronDown, FiChevronUp, FiPackage, FiTrendingUp,
  FiMapPin, FiBarChart2, FiBox
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './Inventory.css';

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const AREAS = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];

const categoryEmojis = {
  'Audio': '🎧', 'Phones': '📱', 'Laptops': '💻', 'Wearables': '⌚',
  'Gaming': '🎮', 'Camera': '📷', 'Tablets': '📟', 'Smart Home': '🏠',
  'Accessories': '🔌', 'Food': '🍔', 'Snacks': '🍿', 'Handcraft': '🎨',
  'Groceries': '🛒', 'Clothing': '👕'
};

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const diff = new Date() - new Date(dateStr);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function Inventory() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [inventoryData, setInventoryData] = useState([]);
  const [loadingInv, setLoadingInv] = useState(true);

  // Fetch this retailer's products from Supabase
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('retailer_id', user.id)
        .order('created_at', { ascending: false });
      setInventoryData(data || []);
      setLoadingInv(false);
    })();
  }, [user?.id]);


  const TABS = [
    { id: 'stock', label: t('nav.inventory'), icon: <FiBox /> },
    { id: 'deadstock', label: t('common.deadStock'), icon: <FiAlertTriangle /> },
    { id: 'sellwise', label: 'Sell Wise Demand', icon: <FiTrendingUp /> },
    { id: 'popular', label: 'Popular in Area', icon: <FiMapPin /> },
  ];

  const [activeTab, setActiveTab] = useState('stock');
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [selectedArea, setSelectedArea] = useState('Mumbai');
  const [toast, setToast] = useState(null);

  const LOW_STOCK_THRESHOLD = 10;
  const CRITICAL_THRESHOLD = 5;
  const DEAD_STOCK_DAYS = 60; // Not sold in 60+ days
  const DEAD_STOCK_SALES_MAX = 2; // Total sales < 2 in 6 months

  const lowStockCount = inventoryData.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
  const criticalCount = inventoryData.filter(p => p.stock <= CRITICAL_THRESHOLD).length;

  // Dead Stock Detection
  const deadStockProducts = useMemo(() => {
    return inventoryData.filter(p => {
      const totalSales = (p.salesHistory || []).reduce((a, b) => a + b, 0);
      const days = daysSince(p.lastSoldDate);
      return totalSales <= DEAD_STOCK_SALES_MAX || days >= DEAD_STOCK_DAYS;
    });
  }, [inventoryData]);

  // Sell Wise Demand: sort by total sales desc
  const sellWiseProducts = useMemo(() => {
    return [...inventoryData].sort((a, b) => {
      const sa = (a.salesHistory || []).reduce((x, y) => x + y, 0);
      const sb = (b.salesHistory || []).reduce((x, y) => x + y, 0);
      return sb - sa;
    });
  }, [inventoryData]);

  // Popular in Area: sort by selected area demand desc
  const popularProducts = useMemo(() => {
    return [...inventoryData].sort((a, b) => {
      const da = (a.areaDemand || {})[selectedArea] || 0;
      const db = (b.areaDemand || {})[selectedArea] || 0;
      return db - da;
    });
  }, [inventoryData, selectedArea]);

  // Stock tab filters
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

  const handleSave = async (productId) => {
    const newStock = parseInt(editStock, 10);
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);
    if (!error) {
      setInventoryData(prev =>
        prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)
      );
    }
    setEditingId(null);
    setToast(error ? '❌ Failed to update stock' : '✅ Stock updated successfully!');
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

  const getDemandColor = (val) => {
    if (val >= 80) return '#10b981';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getDemandLabel = (val) => {
    if (val >= 80) return 'High';
    if (val >= 50) return 'Medium';
    return 'Low';
  };

  const getTrendIcon = (history) => {
    if (!history || history.length < 2) return '→';
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (last > prev) return '↑';
    if (last < prev) return '↓';
    return '→';
  };

  const getTrendColor = (history) => {
    if (!history || history.length < 2) return 'var(--text-muted)';
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (last > prev) return 'var(--success)';
    if (last < prev) return 'var(--danger)';
    return 'var(--text-muted)';
  };

  return (
    <div className="inventory-page page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav.inventory')} Management</h1>
          <p className="page-subtitle">Smart insights to manage your stock intelligently</p>
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
        <div className="inv-stat" onClick={() => { setActiveTab('stock'); setStatusFilter('all'); }}>
          <span className="inv-stat-value">{inventoryData.length}</span>
          <span className="inv-stat-label">{t('common.totalProducts')}</span>
        </div>
        <div className="inv-stat healthy" onClick={() => { setActiveTab('stock'); setStatusFilter('healthy'); }}>
          <span className="inv-stat-value">{inventoryData.filter(p => p.stock > LOW_STOCK_THRESHOLD).length}</span>
          <span className="inv-stat-label">{t('common.healthyStock')}</span>
        </div>
        <div className="inv-stat low" onClick={() => { setActiveTab('stock'); setStatusFilter('low'); }}>
          <span className="inv-stat-value">{inventoryData.filter(p => p.stock <= LOW_STOCK_THRESHOLD && p.stock > CRITICAL_THRESHOLD).length}</span>
          <span className="inv-stat-label">{t('common.lowStock')}</span>
        </div>
        <div className="inv-stat critical" onClick={() => { setActiveTab('stock'); setStatusFilter('critical'); }}>
          <span className="inv-stat-value">{criticalCount}</span>
          <span className="inv-stat-label">{t('common.critical')}</span>
        </div>
        <div className="inv-stat deadstock" onClick={() => setActiveTab('deadstock')}>
          <span className="inv-stat-value">{deadStockProducts.length}</span>
          <span className="inv-stat-label">{t('common.deadStock')}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="inv-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`inv-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: STOCK OVERVIEW ── */}
      {activeTab === 'stock' && (
        <>
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

          <div className="category-filter-row">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Category:</span>
            <button className={`category-btn ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>
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

          {Object.keys(groupedProducts).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category} className="inventory-category-section">
                <button className="inventory-category-header" onClick={() => toggleCategory(category)}>
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
                              <td style={{ fontWeight: 700 }}>₹{product.price}</td>
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
        </>
      )}

      {/* ── TAB: DEAD STOCK ── */}
      {activeTab === 'deadstock' && (
        <div className="tab-section animate-fade-in">
          <div className="inv-section-header">
            <div className="inv-section-icon deadstock-icon">🪦</div>
            <div>
              <h2 className="inv-section-title">Dead Stock Detection</h2>
              <p className="inv-section-desc">
                Products with <strong>no or very low sales</strong> in the past 6 months, or not sold in 60+ days. Consider discounting or removing these items.
              </p>
            </div>
          </div>

          {deadStockProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>No dead stock!</h3>
              <p>All your products are selling well. Keep it up!</p>
            </div>
          ) : (
            <div className="dead-stock-grid">
              {deadStockProducts.map(product => {
                const totalSales = (product.salesHistory || []).reduce((a, b) => a + b, 0);
                const days = daysSince(product.lastSoldDate);
                const staleness = days === Infinity ? '∞ days' : `${days} days ago`;
                const riskLevel = (totalSales === 0 || days >= 120) ? 'High Risk' : days >= 60 ? 'Medium Risk' : 'Slow Mover';
                const riskClass = riskLevel === 'High Risk' ? 'badge-danger' : riskLevel === 'Medium Risk' ? 'badge-warning' : 'badge-info';
                return (
                  <div key={product.id} className="dead-stock-card">
                    <div className="dead-stock-img-wrap">
                      <img src={product.image} alt={product.name} className="dead-stock-img" />
                      <span className={`badge ${riskClass} dead-stock-risk`}>{riskLevel}</span>
                    </div>
                    <div className="dead-stock-info">
                      <h4 className="dead-stock-name">{product.name}</h4>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{product.category}</span>
                      <div className="dead-stock-meta">
                        <div className="dead-meta-row">
                          <span className="dead-meta-label">📦 Stock</span>
                          <span className="dead-meta-val">{product.stock} units</span>
                        </div>
                        <div className="dead-meta-row">
                          <span className="dead-meta-label">🛒 6-Mo Sales</span>
                          <span className="dead-meta-val">{totalSales} units</span>
                        </div>
                        <div className="dead-meta-row">
                          <span className="dead-meta-label">📅 Last Sold</span>
                          <span className="dead-meta-val" style={{ color: days >= 60 ? 'var(--danger)' : 'inherit' }}>{product.lastSoldDate ? staleness : 'Never'}</span>
                        </div>
                        <div className="dead-meta-row">
                          <span className="dead-meta-label">💰 Stock Value</span>
                          <span className="dead-meta-val">₹{(product.stock * product.price).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="dead-stock-chart">
                        <span className="dead-chart-label">Sales Trend (6 mo)</span>
                        <div className="mini-bar-chart">
                          {(product.salesHistory || [0,0,0,0,0,0]).map((val, i) => (
                            <div key={i} className="mini-bar-col">
                              <div
                                className="mini-bar"
                                style={{
                                  height: `${Math.max(val * 4, 2)}px`,
                                  background: val === 0 ? 'var(--danger)' : 'var(--primary)',
                                  opacity: val === 0 ? 0.5 : 1
                                }}
                              />
                              <span className="mini-bar-label">{MONTHS[i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="dead-stock-actions">
                        <button className="btn btn-sm" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', flex: 1 }}>🏷️ Discount</button>
                        <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', flex: 1 }}>🗑️ Remove</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SELL WISE DEMAND ── */}
      {activeTab === 'sellwise' && (
        <div className="tab-section animate-fade-in">
          <div className="inv-section-header">
            <div className="inv-section-icon sellwise-icon">📈</div>
            <div>
              <h2 className="inv-section-title">Sell Wise Demand</h2>
              <p className="inv-section-desc">
                Products ranked by <strong>total sales velocity</strong> over the past 6 months. Use this to prioritize restocking and promotions.
                <span className="ai-badge-soon">🤖 AI Analysis Coming Soon</span>
              </p>
            </div>
          </div>

          <div className="sellwise-list">
            {sellWiseProducts.map((product, idx) => {
              const totalSales = (product.salesHistory || []).reduce((a, b) => a + b, 0);
              const maxSales = Math.max(...sellWiseProducts.map(p => (p.salesHistory || []).reduce((a, b) => a + b, 0))) || 1;
              const trendIcon = getTrendIcon(product.salesHistory);
              const trendColor = getTrendColor(product.salesHistory);
              const last3 = (product.salesHistory || []).slice(-3).reduce((a, b) => a + b, 0);
              const prev3 = (product.salesHistory || []).slice(0, 3).reduce((a, b) => a + b, 0);
              const momentum = prev3 === 0 ? (last3 > 0 ? 100 : 0) : Math.round(((last3 - prev3) / prev3) * 100);

              return (
                <div key={product.id} className={`sellwise-row ${idx === 0 ? 'top-seller' : ''}`}>
                  <div className="sellwise-rank">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="rank-num">#{idx + 1}</span>}
                  </div>
                  <img src={product.image} alt={product.name} className="sellwise-img" />
                  <div className="sellwise-info">
                    <div className="sellwise-top">
                      <span className="sellwise-name">{product.name}</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{product.category}</span>
                    </div>
                    <div className="sellwise-bar-wrap">
                      <div className="sellwise-bar">
                        <div
                          className="sellwise-bar-fill"
                          style={{ width: `${(totalSales / maxSales) * 100}%` }}
                        ></div>
                      </div>
                      <span className="sellwise-bar-label">{totalSales} sold</span>
                    </div>
                    <div className="sellwise-months">
                      {(product.salesHistory || []).map((val, i) => (
                        <div key={i} className="month-cell">
                          <span className="month-val">{val}</span>
                          <span className="month-name">{MONTHS[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sellwise-meta">
                    <span className="sellwise-trend" style={{ color: trendColor }}>
                      {trendIcon} {momentum > 0 ? `+${momentum}%` : `${momentum}%`}
                    </span>
                    <span className="sellwise-meta-label">Momentum</span>
                    <span className="sellwise-stock" style={{ color: getStockBarColor(product.stock) }}>
                      {product.stock} units left
                    </span>
                    <span className="sellwise-meta-label">Stock</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{product.price}</span>
                    <span className="sellwise-meta-label">Price</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: POPULAR IN AREA ── */}
      {activeTab === 'popular' && (
        <div className="tab-section animate-fade-in">
          <div className="inv-section-header">
            <div className="inv-section-icon popular-icon">🗺️</div>
            <div>
              <h2 className="inv-section-title">Popular in Area</h2>
              <p className="inv-section-desc">
                See which products have the <strong>highest demand by city/region</strong>. Optimize your stocking strategy based on local trends.
                <span className="ai-badge-soon">🤖 AI Analysis Coming Soon</span>
              </p>
            </div>
          </div>

          {/* Area Selector */}
          <div className="area-selector">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>📍 Select Area:</span>
            {AREAS.map(area => (
              <button
                key={area}
                className={`area-btn ${selectedArea === area ? 'active' : ''}`}
                onClick={() => setSelectedArea(area)}
              >
                {area}
              </button>
            ))}
          </div>

          {/* Area Heatmap Summary */}
          <div className="area-heatmap-bar">
            <span className="area-heatmap-title">Demand Index for <strong>{selectedArea}</strong></span>
            <div className="area-heatmap-legend">
              <span style={{ color: '#10b981' }}>● High (80+)</span>
              <span style={{ color: '#f59e0b' }}>● Medium (50–79)</span>
              <span style={{ color: '#ef4444' }}>● Low (&lt;50)</span>
            </div>
          </div>

          {/* Products sorted by area demand */}
          <div className="popular-grid">
            {popularProducts.map((product, idx) => {
              const demandVal = (product.areaDemand || {})[selectedArea] || 0;
              const demandColor = getDemandColor(demandVal);
              const demandLabel = getDemandLabel(demandVal);

              return (
                <div key={product.id} className="popular-card">
                  <div className="popular-rank-badge">#{idx + 1}</div>
                  <img src={product.image} alt={product.name} className="popular-img" />
                  <div className="popular-info">
                    <h4 className="popular-name">{product.name}</h4>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginBottom: 8, display: 'inline-block' }}>{product.category}</span>
                    <div className="popular-demand-bar">
                      <div
                        className="popular-demand-fill"
                        style={{ width: `${demandVal}%`, background: demandColor }}
                      ></div>
                    </div>
                    <div className="popular-demand-meta">
                      <span className="popular-demand-val" style={{ color: demandColor }}>{demandVal}% demand</span>
                      <span className={`badge`} style={{ background: `${demandColor}20`, color: demandColor, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20 }}>{demandLabel}</span>
                    </div>

                    {/* All areas mini view */}
                    <div className="popular-area-mini">
                      {Object.entries(product.areaDemand || {}).map(([area, val]) => (
                        <div key={area} className={`area-mini-chip ${area === selectedArea ? 'selected-area' : ''}`}>
                          <span className="area-mini-name">{area.slice(0, 3)}</span>
                          <span className="area-mini-val" style={{ color: getDemandColor(val) }}>{val}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="popular-footer">
                      <span style={{ fontWeight: 700 }}>₹{product.price}</span>
                      <span style={{ color: getStockBarColor(product.stock), fontSize: '0.82rem' }}>{product.stock} in stock</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && <div className="toast success">{toast}</div>}
    </div>
  );
}
