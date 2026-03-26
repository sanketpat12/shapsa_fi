import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [sourceNotifications, setSourceNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsa_read_notif_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('shopsa_read_notif_ids', JSON.stringify(readIds));
  }, [readIds]);

  useEffect(() => {
    if (!user) {
      setSourceNotifications([]);
      return;
    }

    let isMounted = true;

    const fetchLiveNotifications = async () => {
      let notifs = [];
      if (user.role === 'customer') {
        const { data: ords } = await supabase.from('orders').select('*').eq('customer_id', user.id);
        if (ords) {
          ords.forEach(order => {
            notifs.push({
              id: `notif-placed-${order.id}`,
              type: 'order_placed',
              title: 'Order Placed Successfully',
              message: `Your order ${order.id.slice(0,8)} for ₹${order.total_price} has been placed.`,
              icon: '🛒',
              time: order.created_at,
            });
            if (order.status === 'Delivered') {
              notifs.push({
                id: `notif-delivered-${order.id}`,
                type: 'order_delivered',
                title: 'Order Delivered!',
                message: `Your order ${order.id.slice(0,8)} has been delivered. Enjoy your purchase!`,
                icon: '✅',
                time: order.created_at,
              });
            }
            if (order.status === 'Cancelled') {
              notifs.push({
                id: `notif-cancelled-${order.id}`,
                type: 'order_cancelled',
                title: 'Order Cancelled',
                message: `Your order ${order.id.slice(0,8)} has been cancelled by the retailer.`,
                icon: '❌',
                time: order.created_at,
              });
            }
            if (order.status === 'Shipped') {
              notifs.push({
                id: `notif-shipped-${order.id}`,
                type: 'order_shipped',
                title: 'Order Shipped',
                message: `Your order ${order.id.slice(0,8)} is on its way! Track your delivery.`,
                icon: '🚚',
                time: order.created_at,
              });
            }
            if (order.status === 'Processing') {
              notifs.push({
                id: `notif-processing-${order.id}`,
                type: 'order_processing',
                title: 'Order Being Processed',
                message: `Your order ${order.id.slice(0,8)} is being processed by the retailer.`,
                icon: '⏳',
                time: order.created_at,
              });
            }
          });
        }
      } else if (user.role === 'retailer') {
        const { data: ords } = await supabase.from('orders').select(`id, total_price, status, created_at, customer_id`).eq('retailer_id', user.id);
        const { data: prods } = await supabase.from('products').select('*').eq('retailer_id', user.id);
        
        if (ords) {
          const customerIds = [...new Set(ords.map(o => o.customer_id))];
          const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', customerIds);
          const profileMap = {};
          if (profiles) profiles.forEach(p => profileMap[p.id] = p);

          ords.forEach(order => {
            const profile = profileMap[order.customer_id];
            notifs.push({
              id: `notif-neworder-${order.id}`,
              type: 'new_order',
              title: 'New Order Received',
              message: `${profile?.name || profile?.email || 'A customer'} placed order ${order.id.slice(0,8)} for ₹${order.total_price}.`,
              icon: '🛒',
              time: order.created_at,
            });
          });
        }
        if (prods) {
          prods.forEach(product => {
            if (product.stock <= 10) {
              const isCritical = product.stock <= 5;
              notifs.push({
                id: `notif-lowstock-${product.id}`,
                type: 'low_inventory',
                title: isCritical ? '🚨 Critical Low Stock!' : '⚠️ Low Stock Alert',
                message: `"${product.name}" has only ${product.stock} units left. Restock soon!`,
                icon: isCritical ? '🚨' : '⚠️',
                time: product.updated_at || new Date().toISOString(),
              });
            }
          });
        }
      }

      if (isMounted) {
        setSourceNotifications(notifs.sort((a, b) => new Date(b.time) - new Date(a.time)));
      }
    };

    fetchLiveNotifications();

    const channel = supabase.channel(`notifications_${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: `${user.role === 'retailer' ? 'retailer_id' : 'customer_id'}=eq.${user.id}`
      }, (payload) => {
         const order = payload.new;
         const notif = {
           id: `notif-placed-${order.id}`,
           type: 'new_order',
           title: user.role === 'retailer' ? 'New Order Received' : 'Order Placed Successfully',
           message: user.role === 'retailer' 
             ? `An order ${order.id.slice(0,8)} for ₹${order.total_price} was placed.` 
             : `Your order ${order.id.slice(0,8)} for ₹${order.total_price} has been placed.`,
           icon: '🛒',
           time: order.created_at || new Date().toISOString()
         };
         setSourceNotifications(prev => [notif, ...prev].sort((a, b) => new Date(b.time) - new Date(a.time)));
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const notifications = sourceNotifications.map(n => ({
    ...n,
    read: readIds.includes(n.id),
  }));

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setReadIds(prev => [...new Set([...prev, ...notifications.map(n => n.id)])]);
  };

  const markOneRead = (id) => {
    setReadIds(prev => [...new Set([...prev, id])]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markOneRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

export default NotificationContext;
