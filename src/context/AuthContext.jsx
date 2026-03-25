import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Build a merged user object from Supabase session
function buildUserFromSession(session) {
  if (!session?.user) return null;
  const u = session.user;
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    email: u.email,
    name: meta.name || u.email,
    role: meta.role || 'customer',
    avatar: meta.avatar || u.email?.slice(0, 2).toUpperCase(),
    store_name: meta.store_name || null,
    join_date: meta.join_date || u.created_at?.split('T')[0],
    total_orders: meta.total_orders || 0,
    total_spent: meta.total_spent || 0,
    total_products: meta.total_products || 0,
    total_revenue: meta.total_revenue || 0,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsa_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Optionally sync profile to profiles table (non-blocking)
  const syncProfile = async (authUser, meta) => {
    try {
      await supabase.from('profiles').upsert({
        id: authUser.id,
        email: authUser.email,
        name: meta.name,
        role: meta.role,
        avatar: meta.avatar,
        store_name: meta.store_name || null,
        join_date: meta.join_date,
        total_orders: 0,
        total_spent: 0,
        total_products: 0,
        total_revenue: 0,
      }, { onConflict: 'id', ignoreDuplicates: true });
    } catch {
      // profiles table may not exist yet — that's OK
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(buildUserFromSession(session));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(buildUserFromSession(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('shopsa_cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * Register: store role/name in Supabase user_metadata — no extra table needed
   */
  const register = async (userData) => {
    const { name, email, password, role, storeName } = userData;

    const displayName = role === 'retailer' ? (storeName || name) : name;
    const avatar = displayName
      ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : email.slice(0, 2).toUpperCase();

    const meta = {
      name: displayName,
      role,
      avatar,
      join_date: new Date().toISOString().split('T')[0],
      ...(role === 'retailer' ? { store_name: storeName } : {}),
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        return { success: false, error: 'Too many signup attempts. Please wait a few minutes and try again, or use a different email.' };
      }
      return { success: false, error: error.message };
    }

    if (data?.user) {
      // Non-blocking profile table sync
      syncProfile(data.user, meta);
    }

    return { success: true };
  };

  /**
   * Login: Supabase signInWithPassword — role is in user_metadata
   */
  const loginWithCredentials = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: 'Invalid email or password.' };

    const u = buildUserFromSession(data);
    if (!u) return { success: false, error: 'Login failed. Please try again.' };

    return { success: true, role: u.role };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    localStorage.removeItem('shopsa_cart');
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId));

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithCredentials,
      register,
      logout,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartCount,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
