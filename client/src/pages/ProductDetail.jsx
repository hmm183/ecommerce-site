// pages/ProductDetail.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { removeToken } from '../utils/auth';
import './ProductDetail.css';

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


export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    console.log('▶️ Fetching Product ID:', id);
    console.log('📦 token on ProductDetail mount:', localStorage.getItem('token'));
    fetch(`/api/products/${id}`)
      .then(res => {
        console.log('⤷ Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('✅ Product data:', data);
        setProduct(data);
      })
      .catch(err => {
        console.error('❌ Error fetching product:', err);
        // fall back so UI can show an error instead of hanging
        setProduct({ error: true });
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert('Please select a size and color.');
      return;
    }
    addToCart({ ...product, size: selectedSize, color: selectedColor });
    alert('Product added to cart');
  };

  if (product === null) return <div>Loading product...</div>;
  if (product.error) return <div>Failed to load product. Check console.</div>;

  return (
    <>
      <Header />
      <div className="product-detail">
        <img src={product.image} alt={product.name} style={{ maxWidth: '300px' }} />
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p><strong>₹{product.price}</strong></p>

        <div>
          <label>Size: </label>
          <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
            <option value="">--Select--</option>
            {product.sizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Color: </label>
          <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
            <option value="">--Select--</option>
            {product.colors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>

        <button className="btn" onClick={handleAddToCart}>Add to Cart</button>
      </div>
    </>
  );
}