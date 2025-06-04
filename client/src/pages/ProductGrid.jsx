// client/src/pages/ProductGrid.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './ProductGrid.css';
import { removeToken } from '../utils/auth';

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


export default function ProductGrid() {
  const { cartItems } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products.');
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading products...</div>;
  if (error)   return <div className="error">Error: {error.message}</div>;

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <Header />

      <main className="product-grid">
        <h1>Shop All T-Shirts</h1>
        <div className="grid">
          {products.map(product => (
            <div key={product._id} className="product-card">
              <Link to={`/product/${product._id}`}>
                <div className="image-container">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>₹{product.price}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </main>

      {cartCount > 0 && (
        <div style={footerStyle}>
          <span>{cartCount} item{cartCount>1?'s':''} in cart</span>
          <button
            style={buttonStyle}
            onClick={() => navigate('/checkout')}
          >
            View Cart & Checkout
          </button>
        </div>
      )}
    </>
  );
}

const footerStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: '#fff',
  borderTop: '1px solid #ccc',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  boxShadow: '0 -2px 5px rgba(0,0,0,0.1)'
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  background: '#5995fd',
  color: '#fff',
  border: 'none',
  borderRadius: '25px',
  cursor: 'pointer'
};
