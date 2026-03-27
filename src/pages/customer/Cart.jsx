import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import './Cart.css';

export default function Cart() {
  const { user, cart, removeFromCart, updateCartQuantity, clearCart, cartTotal } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [stockWarning, setStockWarning] = useState(null);
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: user?.name || '', address: '', payment: 'Cash on Delivery' });

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to checkout');
    if (!checkoutForm.name.trim() || !checkoutForm.address.trim()) return alert('Please fill in all required fields');
    
    setCheckingOut(true);

    try {
      // Find a fallback retailer for mock products
      let defaultRetailerId = user.id;
      const { data: realProds } = await supabase.from('products').select('retailer_id').not('retailer_id', 'is', null).neq('retailer_id', 1).neq('retailer_id', 2).limit(1);
      
      if (realProds && realProds.length > 0 && realProds[0].retailer_id.length > 20) {
        defaultRetailerId = realProds[0].retailer_id;
      } else {
        const hasMockItems = cart.some(item => !item.retailer_id || item.retailer_id.toString().length < 20);
        if (hasMockItems) {
          setCheckingOut(false);
          return alert("Demo Mode Checkout Failed: No real Retailer accounts found. Please log in as a Retailer, add a new product, and try buying that one!");
        }
      }

      // Group items by retailer_id
      const itemsByRetailer = {};
      cart.forEach(item => {
        // Fallback in case a product is missing retailer_id
        const rId = (item.retailer_id && item.retailer_id.toString().length > 20) ? item.retailer_id : defaultRetailerId; 
        if (!itemsByRetailer[rId]) {
          itemsByRetailer[rId] = [];
        }
        itemsByRetailer[rId].push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        });
      });

      // Create an order for each retailer
      const ordersToInsert = Object.keys(itemsByRetailer).map(retailerId => {
        const items = itemsByRetailer[retailerId];
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Include apportioned 8% tax
        const totalWithTax = subtotal * 1.08;
        
        return {
          customer_id: user.id,
          retailer_id: retailerId,
          items: items,
          total_price: Number(totalWithTax.toFixed(2)),
          status: 'Pending',
          shipping_address: checkoutForm.address.trim(),
          customer_name: checkoutForm.name.trim(),
          payment_mode: checkoutForm.payment
        };
      });

      const { error } = await supabase.from('orders').insert(ordersToInsert);
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      // Save customer profile so retailer sees the name
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: checkoutForm.name.trim(),
        role: user.role || 'customer',
      }, { onConflict: 'id' });

      // Decrement stock for the purchased items
      for (const item of cart) {
        if (item.id) {
          await supabase.rpc('decrement_stock', {
            product_id: item.id,
            qty: item.quantity
          });
        }
      }

      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Failed to place order: ' + err.message);
    } finally {
      setCheckingOut(false);
      setShowCheckoutModal(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="cart-page page-container animate-fade-in-up">
        <div className="order-success">
          <div className="success-icon">🎉</div>
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase. Your order is being processed.</p>
          <div className="success-actions">
            <Link to="/customer/orders" className="btn btn-primary">View My Orders</Link>
            <Link to="/customer/products" className="btn btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page page-container animate-fade-in">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some awesome products to get started!</p>
          <Link to="/customer/products" className="btn btn-primary">
            <FiShoppingBag /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <p className="page-subtitle">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={clearCart}>
          <FiTrash2 /> Clear Cart
        </button>
      </div>

      {stockWarning && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ {stockWarning}
        </div>
      )}
      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item card">
              <div className="cart-item-img">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-category">{item.category}</p>
                <p className="cart-item-price">₹{item.price}</p>
              </div>
              <div className="cart-item-quantity">
                <button
                  className="qty-btn"
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                >
                  <FiMinus />
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => {
                    if (item.stock !== undefined && item.quantity >= item.stock) {
                      setStockWarning(`Only ${item.stock} unit${item.stock > 1 ? 's' : ''} of "${item.name}" available.`);
                      setTimeout(() => setStockWarning(null), 3000);
                      return;
                    }
                    updateCartQuantity(item.id, item.quantity + 1);
                  }}
                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                >
                  <FiPlus />
                </button>
              </div>
              <div className="cart-item-total">
                <span className="item-total-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary card">
          <h3>Order Summary</h3>
          <div className="summary-lines">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            <div className="summary-line">
              <span>Tax (8%)</span>
              <span>₹{(cartTotal * 0.08).toFixed(2)}</span>
            </div>
            <hr />
            <div className="summary-line total">
              <span>Total</span>
              <span>₹{(cartTotal * 1.08).toFixed(2)}</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-lg checkout-btn"
            onClick={() => setShowCheckoutModal(true)}
          >
            Checkout <FiArrowRight />
          </button>
        </div>
      </div>

      {/* ── Checkout Popup Modal ── */}
      {showCheckoutModal && (
        <div onClick={() => setShowCheckoutModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 24
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-white)', borderRadius: 24, padding: 36,
            maxWidth: 480, width: '100%', boxShadow: '0 32px 64px rgba(0,0,0,0.25)',
            animation: 'fadeInUp 0.3s ease'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-dark)' }}>Checkout</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} style={{
                background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark)'
              }}><FiX size={18} /></button>
            </div>

            {/* Order Summary */}
            <div style={{ background: 'var(--accent-light)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '2rem' }}>🛒</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Cart Total</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cart.length} item(s)</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{(cartTotal * 1.08).toFixed(2)}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>incl. 8% tax</div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: 6 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={checkoutForm.name}
                  onChange={e => setCheckoutForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--border)', borderRadius: 12, fontSize: '0.95rem', background: 'var(--bg-white)', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: 6 }}>Delivery Address *</label>
                <textarea
                  required
                  placeholder="House/Flat no., Street, City, PIN code"
                  value={checkoutForm.address}
                  onChange={e => setCheckoutForm(f => ({ ...f, address: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--border)', borderRadius: 12, fontSize: '0.95rem', background: 'var(--bg-white)', resize: 'vertical', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: 6 }}>Payment Mode *</label>
                <select
                  value={checkoutForm.payment}
                  onChange={e => setCheckoutForm(f => ({ ...f, payment: e.target.value }))}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid var(--border)', borderRadius: 12, fontSize: '0.95rem', background: 'var(--bg-white)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
                >
                  <option value="Cash on Delivery">💵 Cash on Delivery</option>
                  <option value="Online">💳 Online Payment</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={checkingOut}
                style={{
                  marginTop: 8, padding: '16px', background: checkingOut ? 'var(--text-muted)' : 'var(--primary)',
                  color: '#fff', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 800,
                  cursor: checkingOut ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                {checkingOut ? '⏳ Placing Order…' : `✅ Place Order — ₹${(cartTotal * 1.08).toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
