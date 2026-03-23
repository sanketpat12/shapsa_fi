import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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
