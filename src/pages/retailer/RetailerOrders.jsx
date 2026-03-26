import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

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
          customer_id
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
                  <td style={{ fontWeight: 500 }}>{order.profiles?.name && order.profiles.name !== order.profiles.email ? order.profiles.name : (order.profiles?.email || `Customer (${order.customer_id.slice(0, 8)})`)}</td>
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
                  <td style={{ fontWeight: 700 }}>₹{order.total_price}</td>
                  <td>
                    {order.status === 'Cancelled' ? (
                      <span className="status-pill cancelled">
                        <span className="status-dot"></span> Cancelled
                      </span>
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
