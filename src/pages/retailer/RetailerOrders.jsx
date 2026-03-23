import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import orders from '../../data/orders';

export default function RetailerOrders() {
  const { user } = useAuth();
  const retailerId = user.id === 3 ? 1 : 2;
  const myOrders = orders.filter(o => o.retailerId === retailerId);
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredOrders = statusFilter === 'All'
    ? myOrders
    : myOrders.filter(o => o.status === statusFilter);

  const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{myOrders.length} total orders</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button
            key={s}
            className={`category-btn ${statusFilter === s ? 'active' : ''}`}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 500,
              border: '2px solid var(--border)',
              background: statusFilter === s ? 'var(--primary)' : 'var(--bg-white)',
              color: statusFilter === s ? 'white' : 'var(--text-body)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
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
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No orders with status "{statusFilter}"
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700 }}>{order.id}</td>
                  <td>{order.customerName}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                          <img src={item.image} alt={item.name} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                          {item.name} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>${order.total}</td>
                  <td>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>
                      <span className="status-dot"></span>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{order.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
