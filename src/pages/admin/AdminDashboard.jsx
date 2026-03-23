import { useAuth } from '../../context/AuthContext';
import products from '../../data/products';
import orders from '../../data/orders';
import { users, customerList, retailerList } from '../../data/users';
import { FiUsers, FiShoppingBag, FiDollarSign, FiActivity, FiTrendingUp, FiPackage } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();

  const totalCustomers = customerList.length;
  const totalRetailers = retailerList.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalProducts = products.length;

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="admin-dashboard page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview and management</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(255, 107, 53, 0.1)', color: 'var(--primary)' }}>
            <FiUsers />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{totalCustomers}</span>
            <span className="kpi-label">Customers</span>
          </div>
          <div className="kpi-trend up">
            <FiTrendingUp /> +12%
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <FiShoppingBag />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{totalRetailers}</span>
            <span className="kpi-label">Retailers</span>
          </div>
          <div className="kpi-trend up">
            <FiTrendingUp /> +8%
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <FiDollarSign />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">${totalRevenue.toLocaleString()}</span>
            <span className="kpi-label">Total Revenue</span>
          </div>
          <div className="kpi-trend up">
            <FiTrendingUp /> +24%
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
            <FiPackage />
          </div>
          <div className="kpi-info">
            <span className="kpi-value">{totalOrders}</span>
            <span className="kpi-label">Total Orders</span>
          </div>
          <div className="kpi-trend up">
            <FiTrendingUp /> +18%
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="admin-grid">
        <div className="card admin-section">
          <h3 className="admin-section-title">Order Status Overview</h3>
          <div className="order-status-list">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="order-status-item">
                <span className={`status-pill ${status.toLowerCase()}`}>
                  <span className="status-dot"></span>
                  {status}
                </span>
                <div className="status-bar-container">
                  <div
                    className="status-bar-fill"
                    style={{ width: `${(count / totalOrders) * 100}%` }}
                  ></div>
                </div>
                <span className="status-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card admin-section">
          <h3 className="admin-section-title">Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/admin/customers" className="quick-action-card">
              <FiUsers className="qa-icon" />
              <div>
                <h4>Manage Customers</h4>
                <p>{totalCustomers} active customers</p>
              </div>
            </Link>
            <Link to="/admin/retailers" className="quick-action-card">
              <FiShoppingBag className="qa-icon" />
              <div>
                <h4>Manage Retailers</h4>
                <p>{totalRetailers} active retailers</p>
              </div>
            </Link>
            <Link to="/admin/settings" className="quick-action-card">
              <FiActivity className="qa-icon" />
              <div>
                <h4>Platform Settings</h4>
                <p>Configure site settings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card admin-section">
        <h3 className="admin-section-title">Recent Orders</h3>
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
              {orders.map(order => (
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
