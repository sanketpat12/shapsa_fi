import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import './Cart.css';

export default function Cart() {
  const { user, cart, removeFromCart, updateCartQuantity, clearCart, cartTotal } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleCheckout = async () => {
    if (!user) return alert('Please log in to checkout');
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
          status: 'Pending'
        };
      });

      const { error } = await supabase.from('orders').insert(ordersToInsert);
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      // Save customer profile so retailer can see the name
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: user.name || user.email,
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
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
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
            onClick={handleCheckout}
            disabled={checkingOut}
          >
            {checkingOut ? 'Processing...' : 'Checkout'}
            {!checkingOut && <FiArrowRight />}
          </button>
        </div>
      </div>
    </div>
  );
}
