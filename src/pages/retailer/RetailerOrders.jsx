import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiTrash2 } from 'react-icons/fi';

export default function RetailerOrders() {
  const { user } = useAuth();
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_price,
          status,
          created_at,
          items,
          customer_id,
          shipping_address,
          customer_name,
          payment_mode
        `)
        .eq('retailer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const customerIds = [...new Set(data.map(o => o.customer_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', customerIds);
        
        const profileMap = {};
        if (profiles) profiles.forEach(p => profileMap[p.id] = p);
        
        const mergedData = data.map(o => ({
           ...o,
           profiles: profileMap[o.customer_id] || null
        }));
        setMyOrders(mergedData);
      }
      setLoading(false);
    };

    fetchOrders();

    const channel = supabase.channel(`retailer_orders_list_${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `retailer_id=eq.${user?.id}` }, () => {
        fetchOrders(); // Refetch on update or insert
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } else {
      alert("Failed to update status.");
    }
  };

  const handleClearOrder = async (orderId) => {
    if (!window.confirm("Remove this cancelled order from your history completely?")) return;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('retailer_id', user.id);

    if (error) {
      console.error('Clear order error:', error);
      alert('Could not clear order: ' + error.message);
    } else {
      setMyOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const filteredOrders = statusFilter === 'All'
    ? myOrders
    : myOrders.filter(o => o.status === statusFilter);

  const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Dashboard</h1>
          <p className="page-subtitle">{loading ? 'Loading...' : `${myOrders.length} total orders`}</p>
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
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No orders with status "{statusFilter}"
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700, fontSize: '0.8rem', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.id}>{order.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: 2 }}>
                      {order.customer_name || (order.profiles?.name !== order.profiles?.email ? order.profiles?.name : 'Customer')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                      📧 {order.profiles?.email || `ID: ${order.customer_id.slice(0, 8)}`}
                    </div>
                    {order.shipping_address && (
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '6px', borderRadius: 6, maxWidth: 220, whiteSpace: 'pre-wrap' }}>
                        📍 {order.shipping_address}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                          <img src={item.image} alt={item.name} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{item.name} x{item.quantity}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@ ₹{item.price}/ea</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>₹{order.total_price}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(incl. 8% tax)</div>
                    {order.payment_mode && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-body)', marginTop: 4, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                        💳 {order.payment_mode}
                      </div>
                    )}
                  </td>
                  <td>
                    {order.status === 'Cancelled' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="status-pill cancelled">
                          <span className="status-dot"></span> Cancelled
                        </span>
                        <button 
                          onClick={() => handleClearOrder(order.id)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: '8px', transition: 'all 0.2s' }}
                          title="Clear from history"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
                        >
                          <FiTrash2 size={14} /> Clear
                        </button>
                      </div>
                    ) : (
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-white)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
