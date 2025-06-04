// client/src/pages/Cart.jsx
import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import './Cart.css';

function Header() {
  const { cartItems } = useContext(CartContext);
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const handleHomeClick = () => {
    removeToken();
  };
  return (
    <header className="header">
      <nav className="nav-bar">
        <Link to="/" className="nav-link" onClick={handleHomeClick}>Home</Link>
        <Link to="/shop" className="nav-link">Shop</Link>
        <Link to="/order-status" className="nav-link">Your Orders</Link>
        <Link to="/cart" className="nav-link cart">
          <span role="img" aria-label="cart">🛒</span>
          {count > 0 && <span className="badge">{count}</span>}
        </Link>
      </nav>
    </header>
  );
}

export default function Cart() {
  const { cartItems, increaseQty, decreaseQty, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const handleCheckout = () => {
    navigate('/checkout'); // 🔁 Redirect to checkout page
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div><h1>Your Cart is Empty</h1></div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="cart-page">
        <h1>Your Cart</h1>
        <table className="cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Color</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map(item => (
              <tr key={`<span class="math-inline">\{item\.\_id\}\-</span>{item.size}-${item.color}`}>
                <td data-label="Product">{item.name}</td>
                <td data-label="Size">{item.size}</td>
                <td data-label="Color">{item.color}</td>
                <td data-label="Quantity">
                  <button onClick={() => decreaseQty(item._id, item.size, item.color)}>-</button>
                  {item.quantity}
                  <button onClick={() => increaseQty(item._id, item.size, item.color)}>+</button>
                </td>
                <td data-label="Price">₹{item.price}</td>
                <td data-label="Subtotal">₹{(item.quantity * item.price).toFixed(2)}</td>
                <td data-label="Actions">
                  <button onClick={() => removeFromCart(item._id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cart-summary">
          <h2>Total: ₹{totalPrice.toFixed(2)}</h2>
          <button className="btn" onClick={handleCheckout}>Checkout</button>
        </div>
      </div>
    </>
  );
}
