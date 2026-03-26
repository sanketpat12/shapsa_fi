import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { analyzeSellWiseDemand, analyzePopularInArea, analyzeDeadStock, detectDeadStockIds } from '../../utils/aiService';
import {
  FiAlertTriangle, FiEdit2, FiCheck, FiX, FiSearch,
  FiChevronDown, FiChevronUp, FiPackage, FiTrendingUp,
  FiMapPin, FiBarChart2, FiBox, FiCpu, FiArchive
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './Inventory.css';

const getDynamicMonths = () => {
  const labels = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
     const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
     labels.push(d.toLocaleString('default', { month: 'short' }));
  }
  return labels;
};
const MONTHS = getDynamicMonths();
const defaultAreas = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];

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

  const [activeTab, setActiveTab] = useState('stock');
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [selectedArea, setSelectedArea] = useState('Mumbai');
  const [dynamicAreas, setDynamicAreas] = useState(defaultAreas);
  const [deadStockIds, setDeadStockIds] = useState([]);
  const [isDetectingDeadStock, setIsDetectingDeadStock] = useState(false);
  const [toast, setToast] = useState(null);

  // Discount Modal state
  const [discountModal, setDiscountModal] = useState(null); // { product }
  const [discountPct, setDiscountPct] = useState(10);
  const [discountLabel, setDiscountLabel] = useState('');
  const [discountSaving, setDiscountSaving] = useState(false);

  // Fetch this retailer's products and orders from Supabase to compute live graphs
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('retailer_id', user.id)
        .order('created_at', { ascending: false });

      const { data: ordersData } = await supabase
        .from('orders')
        .select('created_at, items, status, shipping_address')
        .eq('retailer_id', user.id)
        .neq('status', 'Cancelled');

      const now = new Date();
      const monthParams = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthParams.push({ year: d.getFullYear(), month: d.getMonth() });
      }

      const salesMap = {};
      
      if (ordersData) {
        ordersData.forEach(order => {
          const orderDate = new Date(order.created_at);
          order.items.forEach(item => {
            if (!salesMap[item.id]) salesMap[item.id] = { history: [0,0,0,0,0,0], lastSold: null };
            if (!salesMap[item.id].lastSold || orderDate > salesMap[item.id].lastSold) {
               salesMap[item.id].lastSold = orderDate;
            }
            const orderY = orderDate.getFullYear();
            const orderM = orderDate.getMonth();
            monthParams.forEach((m, idx) => {
              if (m.year === orderY && m.month === orderM) {
                salesMap[item.id].history[idx] += item.quantity;
              }
            });
          });
        });
        
        // Extract unique cities/areas from shipping_address (simplistic extraction: take text before last comma)
        const extractedAreas = new Set();
        ordersData.forEach(o => {
          if (o.shipping_address) {
            const parts = o.shipping_address.split(',').map(s => s.trim());
            if (parts.length > 1) extractedAreas.add(parts[parts.length - 2]); // e.g. "Street, City, Pin" -> City
            else extractedAreas.add(o.shipping_address);
          }
        });
        if (extractedAreas.size > 0) {
          const areasArr = Array.from(extractedAreas).filter(Boolean);
          setDynamicAreas(areasArr);
          setSelectedArea(areasArr[0]);
        }
      }

      const mergedData = (productsData || []).map(p => ({
        ...p,
        salesHistory: salesMap[p.id]?.history || [0,0,0,0,0,0],
        lastSoldDate: salesMap[p.id]?.lastSold || null
      }));

      setInventoryData(mergedData);
    })();
  }, [user?.id]);

  // ─── Supabase Real-time: auto-refresh on any product change ───
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('inventory-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `retailer_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setInventoryData(prev => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'INSERT') {
          setInventoryData(prev => [{ ...payload.new, salesHistory: [0,0,0,0,0,0], lastSoldDate: null }, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setInventoryData(prev => prev.map(p =>
            p.id === payload.new.id ? { ...p, ...payload.new } : p
          ));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const TABS = [
    { id: 'stock', label: t('nav.inventory'), icon: <FiBox /> },
    { id: 'deadstock', label: t('common.deadStock'), icon: <FiArchive /> },
    { id: 'sellwise', label: 'Sell Wise Demand', icon: <FiTrendingUp /> },
    { id: 'popular', label: 'Popular in Area', icon: <FiMapPin /> },
  ];

  const handleOpenDiscount = (product) => {
    setDiscountModal({ product });
    setDiscountPct(product.discount || 10);
    setDiscountLabel(product.deal_label || 'Flash Sale');
  };

  const handleSaveDiscount = async () => {
    if (!discountModal) return;
    setDiscountSaving(true);
    const { error } = await supabase
      .from('products')
      .update({ discount: discountPct, deal_label: discountLabel, deal_active: true })
      .eq('id', discountModal.product.id);
    if (error) {
      setToast('❌ Failed to save discount');
    } else {
      setInventoryData(prev => prev.map(p =>
        p.id === discountModal.product.id ? { ...p, discount: discountPct, deal_label: discountLabel, deal_active: true } : p
      ));
      setToast(`✅ Deal live! ${discountPct}% off "${discountModal.product.name}"`);
      setDiscountModal(null);
    }
    setDiscountSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemoveDeal = async (productId) => {
    await supabase.from('products').update({ discount: 0, deal_label: null, deal_active: false }).eq('id', productId);
    setInventoryData(prev => prev.map(p => p.id === productId ? { ...p, discount: 0, deal_label: null, deal_active: false } : p));
    setToast('🚫 Deal removed');
    setTimeout(() => setToast(null), 2000);
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Remove this product permanently?')) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setInventoryData(prev => prev.filter(p => p.id !== productId));
      setToast('🗑️ Product removed');
      setTimeout(() => setToast(null), 2000);
    }
  };

  // AI Analysis state
  const [aiSellWiseText, setAiSellWiseText] = useState('');
  const [aiSellWiseLoading, setAiSellWiseLoading] = useState(false);
  const [aiPopularText, setAiPopularText] = useState('');
  const [aiPopularLoading, setAiPopularLoading] = useState(false);
  const [aiDeadStockText, setAiDeadStockText] = useState('');
  const [aiDeadStockLoading, setAiDeadStockLoading] = useState(false);

  const handleAiSellWise = async () => {
    setAiSellWiseLoading(true);
    setAiSellWiseText('');
    try {
      const text = await analyzeSellWiseDemand(sellWiseProducts);
      setAiSellWiseText(text);
    } catch { setAiSellWiseText('⚠️ AI analysis failed. Please try again.'); }
    setAiSellWiseLoading(false);
  };

  const handleAiPopular = async () => {
    setAiPopularLoading(true);
    setAiPopularText('');
    try {
      const text = await analyzePopularInArea(selectedArea, popularProducts);
      setAiPopularText(text);
    } catch { setAiPopularText('⚠️ AI analysis failed. Please try again.'); }
    setAiPopularLoading(false);
  };

  const handleAiDeadStock = async () => {
    setAiDeadStockLoading(true);
    setAiDeadStockText('');
    try {
      const text = await analyzeDeadStock(deadStockProducts);
      setAiDeadStockText(text);
    } catch { setAiDeadStockText('⚠️ AI analysis failed. Please try again.'); }
    setAiDeadStockLoading(false);
  };

  const LOW_STOCK_THRESHOLD = 10;
  const CRITICAL_THRESHOLD = 5;
  const DEAD_STOCK_DAYS = 60; // Not sold in 60+ days
  const DEAD_STOCK_SALES_MAX = 2; // Total sales < 2 in 6 months

  const lowStockCount = inventoryData.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
  const criticalCount = inventoryData.filter(p => p.stock <= CRITICAL_THRESHOLD).length;

  // Dead Stock Detection – AI detects low-sales items on first tab visit
  const detectingRef = React.useRef(false);
  useEffect(() => {
    if (activeTab !== 'deadstock') return;
    if (inventoryData.length === 0) return;
    if (deadStockIds.length > 0) return;
    if (detectingRef.current) return;

    async function run() {
      detectingRef.current = true;
      setIsDetectingDeadStock(true);
      try {
        const ids = await detectDeadStockIds(inventoryData);
        setDeadStockIds(ids);
      } catch (_e) { /* silent on AI errors */ } // eslint-disable-line no-unused-vars
      setIsDetectingDeadStock(false);
      detectingRef.current = false;
    }
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, inventoryData.length]);

  const deadStockProducts = useMemo(() => {
    return inventoryData.filter(p => deadStockIds.includes(p.id));
  }, [inventoryData, deadStockIds]);

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
            <div className="inv-section-icon deadstock-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiArchive size={28} />
            </div>
            <div>
              <h2 className="inv-section-title">Dead Stock Detection</h2>
              <p className="inv-section-desc">
                Products with <strong>no or very low sales</strong> in the past 6 months, or not sold in 60+ days. Consider discounting or removing these items.
              </p>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="ai-insight-panel">
            <div className="section-header">
              <h2><FiArchive /> {t('common.deadStock')} Analysis</h2>
              <div className="section-actions">
                <button className="btn btn-outline" onClick={handleAiDeadStock} disabled={aiDeadStockLoading || isDetectingDeadStock || deadStockProducts.length === 0}>
                   <FiCpu /> {aiDeadStockLoading ? 'Analyzing...' : isDetectingDeadStock ? 'NVIDIA Processing...' : 'Get Strategy'}
                </button>
              </div>
            </div>
            {aiDeadStockText && (
              <div className="ai-insight-result">
                {aiDeadStockText.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                ))}
              </div>
            )}
            {!aiDeadStockText && !aiDeadStockLoading && (
              <div className="ai-insight-placeholder">Waiting for AI to analyze stock data...</div>
            )}
          </div>

            {isDetectingDeadStock ? (
              <div className="empty-state">
                <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
                <h3 style={{ color: 'var(--primary)' }}>NVIDIA AI is analyzing your inventory...</h3>
                <p>Detecting critically low sales velocity...</p>
              </div>
            ) : deadStockProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No dead stock found!</h3>
                <p>Your AI says inventory is moving well.</p>
              </div>
            ) : (
              <div className="inventory-grid">
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
                        {product.deal_active ? (
                          <button className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)', flex: 1 }} onClick={() => handleRemoveDeal(product.id)}>✅ Deal Active — Remove</button>
                        ) : (
                          <button className="btn btn-sm" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', flex: 1 }} onClick={() => handleOpenDiscount(product)}>🏷️ Add Deal</button>
                        )}
                        <button className="btn btn-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', flex: 1 }} onClick={() => handleRemoveProduct(product.id)}>🗑️ Remove</button>
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
              </p>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="ai-insight-panel">
            <div className="ai-insight-header">
              <span className="ai-insight-icon">🤖</span>
              <span className="ai-insight-title">AI Demand Analysis</span>
              <button
                className="btn-ai-analyze"
                onClick={handleAiSellWise}
                disabled={aiSellWiseLoading || sellWiseProducts.length === 0}
              >
                {aiSellWiseLoading ? <><span className="ai-spinner-inv" /> Analyzing…</> : <><FiCpu /> Get AI Analysis</>}
              </button>
            </div>
            {aiSellWiseText && (
              <div className="ai-insight-result">
                {aiSellWiseText.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                ))}
              </div>
            )}
            {!aiSellWiseText && !aiSellWiseLoading && (
              <div className="ai-insight-placeholder">Click "Get AI Analysis" to receive intelligent restocking recommendations powered by Gemma AI.</div>
            )}
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
              </p>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="ai-insight-panel">
            <div className="ai-insight-header">
              <span className="ai-insight-icon">🤖</span>
              <span className="ai-insight-title">AI Area Insights for <strong>{selectedArea}</strong></span>
              <button
                className="btn-ai-analyze"
                onClick={handleAiPopular}
                disabled={aiPopularLoading || popularProducts.length === 0}
              >
                {aiPopularLoading ? <><span className="ai-spinner-inv" /> Analyzing…</> : <><FiCpu /> Get AI Insights</>}
              </button>
            </div>
            {aiPopularText && (
              <div className="ai-insight-result">
                {aiPopularText.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                ))}
              </div>
            )}
            {!aiPopularText && !aiPopularLoading && (
              <div className="ai-insight-placeholder">Click "Get AI Insights" to learn what products are trending in {selectedArea} based on local demographics.</div>
            )}
          </div>

          {/* Area Selector */}
          <div className="area-selector">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>📍 Select Area:</span>
            {dynamicAreas.map(area => (
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

      {/* ── DISCOUNT MODAL ── */}
      {discountModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-xl)', padding: 32, width: 420, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>🏷️ Create Deal</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Set a discount for <strong>{discountModal.product.name}</strong> — it will instantly appear on the customer Deals page.</p>
            
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem' }}>Discount Percentage</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[10, 15, 20, 25, 30, 50].map(pct => (
                <button key={pct} onClick={() => setDiscountPct(pct)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: discountPct === pct ? '2px solid var(--primary)' : '2px solid var(--border)', background: discountPct === pct ? 'rgba(255,107,53,0.1)' : 'var(--bg-secondary)', fontWeight: 700, cursor: 'pointer', color: discountPct === pct ? 'var(--primary)' : 'var(--text)', fontSize: '0.85rem' }}>
                  {pct}%
                </button>
              ))}
            </div>

            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem' }}>Deal Label</label>
            <input
              type="text"
              value={discountLabel}
              onChange={e => setDiscountLabel(e.target.value)}
              placeholder="e.g. Flash Sale, Clearance, Weekend Deal"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', fontSize: '0.9rem', marginBottom: 24, boxSizing: 'border-box' }}
            />

            <div style={{ background: 'rgba(255,107,53,0.08)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{Math.round(discountModal.product.price * (1 - discountPct / 100))}</span>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: 8 }}>₹{discountModal.product.price}</span>
              <span style={{ marginLeft: 8, background: 'var(--danger)', color: 'white', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{discountPct}% OFF</span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDiscountModal(null)} disabled={discountSaving}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveDiscount} disabled={discountSaving}>
                {discountSaving ? 'Saving...' : '🚀 Go Live!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
