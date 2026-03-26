import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

export default function Orders() {
  const { user } = useAuth();
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? Stock will be restored.")) return;

    // Get the order items first (so we can restore stock)
    const orderToCancel = userOrders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    // Try direct update first
    const { error } = await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('id', orderId)
      .eq('customer_id', user.id); // RLS already restricts Pending-only

    if (!error) {
      // Restore stock for each item
      if (orderToCancel.items) {
        for (const item of orderToCancel.items) {
          if (item.id) {
            await supabase.rpc('restore_stock', {
              product_id: item.id,
              qty: item.quantity
            });
          }
        }
      }
      setUserOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
    } else {
      console.error('Cancel order error:', error);
      // Fallback: use the cancel_order RPC which bypasses RLS
      const { error: rpcError } = await supabase.rpc('cancel_order', {
        order_id: orderId,
        cust_id: user.id
      });
      if (!rpcError) {
        if (orderToCancel.items) {
          for (const item of orderToCancel.items) {
            if (item.id) {
              await supabase.rpc('restore_stock', { product_id: item.id, qty: item.quantity });
            }
          }
        }
        setUserOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
      } else {
        console.error('Cancel RPC error:', rpcError);
        alert("Could not cancel order: " + rpcError.message);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <FiCheckCircle />;
      case 'Shipped': return <FiTruck />;
      case 'Processing': return <FiPackage />;
      default: return <FiClock />;
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">{userOrders.length} orders placed</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading orders...</div>
      ) : userOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here once you make a purchase.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {userOrders.map(order => (
            <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'var(--accent-light)', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', gap: 32, fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Order ID</span>
                    <p style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{order.id}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Date</span>
                    <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Total</span>
                    <p style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{order.total_price}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {order.status === 'Pending' && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <FiXCircle /> Cancel Order
                    </button>
                  )}
                  <span className={`status-pill ${order.status.toLowerCase()}`}>
                    <span className="status-dot"></span>
                    {order.status}
                  </span>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: i < order.items.length - 1 ? 16 : 0 }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: 60, height: 60, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
                    </div>
                    <p style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
