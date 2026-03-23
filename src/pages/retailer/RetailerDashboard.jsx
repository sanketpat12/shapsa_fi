import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import products from '../../data/products';
import orders from '../../data/orders';
import { FiPackage, FiDollarSign, FiAlertTriangle, FiShoppingCart, FiTrendingUp, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './RetailerDashboard.css';

export default function RetailerDashboard() {
  const { user } = useAuth();
  const retailerId = user.role === 'retailer' ? (user.id === 3 ? 1 : 2) : 1;

  const myProducts = products.filter(p => p.retailerId === retailerId);
  const myOrders = orders.filter(o => o.retailerId === retailerId);
  const lowStockProducts = myProducts.filter(p => p.stock <= 10);
  const totalRevenue = myOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="retailer-dashboard page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Retailer Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.name}</p>
        </div>
        <Link to="/retailer/products" className="btn btn-primary">
          <FiPlus /> Add Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid-4 dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 107, 53, 0.1)', color: 'var(--primary)' }}>
            <FiPackage />
          </div>
          <div className="stat-value">{myProducts.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <FiShoppingCart />
          </div>
          <div className="stat-value">{myOrders.length}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <FiDollarSign />
          </div>
          <div className="stat-value">${totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: lowStockProducts.length > 0 ? 'var(--danger-bg)' : 'var(--success-bg)', color: lowStockProducts.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            <FiAlertTriangle />
          </div>
          <div className="stat-value">{lowStockProducts.length}</div>
          <div className="stat-label">Low Stock Alerts</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-section">
          <h2 className="section-title">
            <FiAlertTriangle style={{ color: 'var(--danger)' }} /> Low Stock Alerts
          </h2>
          <div className="alert alert-warning">
            ⚠️ {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on inventory. Restock soon!
          </div>
          <div className="low-stock-grid">
            {lowStockProducts.map(product => (
              <div key={product.id} className="low-stock-card card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: 2 }}>{product.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${product.stock <= 5 ? 'badge-danger' : 'badge-warning'}`}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="recent-orders-section">
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Recent Orders</h2>
          <Link to="/retailer/orders" className="btn btn-outline btn-sm">View All</Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700 }}>{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
                  <td style={{ fontWeight: 700 }}>${order.total}</td>
                  <td>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>
                      <span className="status-dot"></span>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
