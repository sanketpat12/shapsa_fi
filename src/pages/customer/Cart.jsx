import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useState } from 'react';
import './Cart.css';

export default function Cart() {
  const { cart, removeFromCart, updateCartQuantity, clearCart, cartTotal } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleCheckout = () => {
    setCheckingOut(true);
    setTimeout(() => {
      setOrderPlaced(true);
      clearCart();
      setCheckingOut(false);
    }, 1500);
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
                <p className="cart-item-price">${item.price}</p>
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
                <span className="item-total-price">${(item.price * item.quantity).toFixed(2)}</span>
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
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-line">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            <div className="summary-line">
              <span>Tax (8%)</span>
              <span>${(cartTotal * 0.08).toFixed(2)}</span>
            </div>
            <hr />
            <div className="summary-line total">
              <span>Total</span>
              <span>${(cartTotal * 1.08).toFixed(2)}</span>
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
