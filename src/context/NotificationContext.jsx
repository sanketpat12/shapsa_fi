import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import products from '../data/products';
import orders from '../data/orders';

const NotificationContext = createContext(null);

function generateCustomerNotifications(userId) {
  const userOrders = orders.filter(o => o.customerId === userId);
  const notifications = [];

  userOrders.forEach(order => {
    // Order placed notification
    notifications.push({
      id: `notif-placed-${order.id}`,
      type: 'order_placed',
      title: 'Order Placed Successfully',
      message: `Your order ${order.id} for ₹${order.total} has been placed.`,
      icon: '🛒',
      time: order.date,
      read: false,
    });

    // Order delivered notification
    if (order.status === 'Delivered') {
      notifications.push({
        id: `notif-delivered-${order.id}`,
        type: 'order_delivered',
        title: 'Order Delivered!',
        message: `Your order ${order.id} has been delivered. Enjoy your purchase!`,
        icon: '✅',
        time: order.date,
        read: false,
      });
    }

    // Order cancelled notification
    if (order.status === 'Cancelled') {
      notifications.push({
        id: `notif-cancelled-${order.id}`,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `Your order ${order.id} has been cancelled by the retailer.`,
        icon: '❌',
        time: order.date,
        read: false,
      });
    }

    // Order shipped notification
    if (order.status === 'Shipped') {
      notifications.push({
        id: `notif-shipped-${order.id}`,
        type: 'order_shipped',
        title: 'Order Shipped',
        message: `Your order ${order.id} is on its way! Track your delivery.`,
        icon: '🚚',
        time: order.date,
        read: false,
      });
    }

    // Order processing notification
    if (order.status === 'Processing') {
      notifications.push({
        id: `notif-processing-${order.id}`,
        type: 'order_processing',
        title: 'Order Being Processed',
        message: `Your order ${order.id} is being processed by the retailer.`,
        icon: '⏳',
        time: order.date,
        read: false,
      });
    }
  });

  // Sort newest first
  return notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
}

function generateRetailerNotifications(retailerId) {
  const LOW_STOCK_THRESHOLD = 10;
  const myOrders = orders.filter(o => o.retailerId === retailerId);
  const myProducts = products.filter(p => p.retailerId === retailerId);
  const notifications = [];

  // New order notifications
  myOrders.forEach(order => {
    notifications.push({
      id: `notif-neworder-${order.id}`,
      type: 'new_order',
      title: 'New Order Received',
      message: `${order.customerName} placed order ${order.id} for ₹${order.total}.`,
      icon: '🛒',
      time: order.date,
      read: false,
    });
  });

  // Low stock notifications
  myProducts.forEach(product => {
    if (product.stock <= LOW_STOCK_THRESHOLD) {
      const isCritical = product.stock <= 5;
      notifications.push({
        id: `notif-lowstock-${product.id}`,
        type: 'low_inventory',
        title: isCritical ? '🚨 Critical Low Stock!' : '⚠️ Low Stock Alert',
        message: `"${product.name}" has only ${product.stock} units left. Restock soon!`,
        icon: isCritical ? '🚨' : '⚠️',
        time: new Date().toISOString().split('T')[0],
        read: false,
      });
    }
  });

  return notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
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

  const getRawNotifications = () => {
    if (!user) return [];
    if (user.role === 'customer') {
      return generateCustomerNotifications(user.id);
    }
    if (user.role === 'retailer') {
      const retailerId = user.id === 3 ? 1 : 2;
      return generateRetailerNotifications(retailerId);
    }
    return [];
  };

  const rawNotifications = getRawNotifications();

  const notifications = rawNotifications.map(n => ({
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
