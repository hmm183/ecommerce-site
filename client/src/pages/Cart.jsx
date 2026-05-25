import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './Cart.css';

export default function Cart() {
  const { cartItems, increaseQty, decreaseQty, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="empty-cart-state">
          <i className="fas fa-shopping-bag empty-cart-icon" />
          <h2>Your Cart is Empty</h2>
          <p>Explore our premium curated collection and add items to begin your journey.</p>
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>Go to Shop</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        <div className="cart-layout">
          
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div className="cart-item-card" key={`${item._id}-${item.size}-${item.color}`}>
                <div className="cart-item-img-wrapper">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-meta">
                    <span>Size: <strong>{item.size}</strong></span>
                    <span>Color: <strong>{item.color}</strong></span>
                  </div>
                  <div className="cart-item-price">₹{item.price} each</div>
                </div>

                <div className="cart-item-qty-control">
                  <button className="qty-btn" onClick={() => decreaseQty(item._id, item.size, item.color)}>-</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => increaseQty(item._id, item.size, item.color)}>+</button>
                </div>

                <div className="cart-item-subtotal">
                  ₹{(item.quantity * item.price).toFixed(2)}
                </div>

                <button 
                  className="cart-item-remove-btn" 
                  onClick={() => removeFromCart(item._id, item.size, item.color)}
                  title="Remove item"
                >
                  <i className="fas fa-trash-alt" />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary-card">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
