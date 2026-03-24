import { createContext, useContext, useState, useEffect } from 'react';
import { users as seededUsers } from '../data/users';

const AuthContext = createContext(null);

// Helper: get all registered users from localStorage
function getRegisteredUsers() {
  try {
    const saved = localStorage.getItem('shopsa_registered_users');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Helper: save registered users list to localStorage
function saveRegisteredUsers(list) {
  localStorage.setItem('shopsa_registered_users', JSON.stringify(list));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shopsa_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('shopsa_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('shopsa_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shopsa_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('shopsa_cart', JSON.stringify(cart));
  }, [cart]);

  const login = (userData) => {
    setUser(userData);
  };

  /**
   * Attempt login by email + password.
   * Checks localStorage registered users first, then seeded users.
   * Returns { success, user, error }
   */
  const loginWithCredentials = (email, password) => {
    const registered = getRegisteredUsers();
    const allUsers = [...registered, ...seededUsers];
    const found = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      login(found);
      return { success: true, user: found };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  /**
   * Register a new user.
   * Returns { success, error }
   */
  const register = (userData) => {
    const registered = getRegisteredUsers();
    const allEmails = [
      ...registered.map((u) => u.email.toLowerCase()),
      ...seededUsers.map((u) => u.email.toLowerCase()),
    ];

    if (allEmails.includes(userData.email.toLowerCase())) {
      return { success: false, error: 'This email is already registered. Please log in.' };
    }

    const newUser = {
      ...userData,
      id: `reg_${Date.now()}`,
      avatar: userData.name
        ? userData.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
        : userData.email.slice(0, 2).toUpperCase(),
      joinDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpent: 0,
      ...(userData.role === 'retailer' ? { totalProducts: 0, totalRevenue: 0 } : {}),
    };

    const updated = [...registered, newUser];
    saveRegisteredUsers(updated);
    login(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem('shopsa_user');
    localStorage.removeItem('shopsa_cart');
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithCredentials,
      register,
      logout,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
