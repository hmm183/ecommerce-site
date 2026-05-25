import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './ProductGrid.css';

export default function ProductGrid() {
  const { cartItems } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(getApiUrl('/api/products'))
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

  if (loading) {
    return (
      <>
        <Header />
        <main className="product-grid-container">
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="product-card skeleton-card">
                <div className="skeleton-image"></div>
                <div className="product-info-block">
                  <div className="skeleton-text skeleton-tag"></div>
                  <div className="skeleton-text skeleton-title"></div>
                  <div className="skeleton-text skeleton-price"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="grid-error-msg">Error: {error.message}</div>
      </>
    );
  }

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Dynamically get unique categories from products
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get featured products
  const featuredProducts = products.filter(p => p.isFeatured);

  // Helper component to render a product card
  const renderProductCard = (product, isFeaturedCard = false) => {
    const isRecommended = product.rating && product.rating > 4.5;
    
    return (
      <div 
        key={product._id} 
        className={`product-card ${isFeaturedCard ? 'featured-product-card' : ''}`}
      >
        <Link to={`/product/${product._id}`}>
          <div className="product-image-wrapper">
            {/* Badges Container */}
            <div className="badge-container">
              {product.isOnSale && <span className="card-badge sale-badge">Sale</span>}
              {product.isFeatured && <span className="card-badge featured-badge">Featured</span>}
              {isRecommended && <span className="card-badge recommended-badge">★ Recommended</span>}
            </div>
            
            <img src={product.image} alt={product.name} />
          </div>
          <div className="product-info-block">
            <span className="product-category-tag">{product.category || 'Apparel'}</span>
            <h3 className="product-name-title">{product.name}</h3>
            
            {/* Stars rating in grid */}
            {product.reviewCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                <span>{'★'.repeat(Math.round(product.rating))}</span>
                <span style={{ color: 'var(--text-secondary)' }}>({product.reviewCount})</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                No reviews yet
              </div>
            )}

            <div className="product-price-label">
              {product.isOnSale ? (
                <>
                  <span className="price-cross">₹{product.price}</span>
                  <span className="price-sale">₹{product.salePrice}</span>
                </>
              ) : (
                <span>₹{product.price}</span>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <>
      <Header />

      <main className="product-grid-container">
        <h1>Explore WOT (World of Tshirts)</h1>

        <div className="search-filter-section">
          <div className="search-wrapper">
            <i className="fas fa-search search-input-icon" />
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="category-chips">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 🌟 FEATURED COLLECTION SECTION (Show only on All + No active search query) */}
        {selectedCategory === 'All' && searchQuery === '' && featuredProducts.length > 0 && (
          <section className="featured-section">
            <h2 className="featured-section-title">
              <i className="fas fa-star" /> Featured Collection
            </h2>
            <div className="products-grid">
              {featuredProducts.map(p => renderProductCard(p, true))}
            </div>
          </section>
        )}

        {/* Standard Catalog Listing */}
        <h2>All Products</h2>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>No products found matching your search.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(p => renderProductCard(p, false))}
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <div className="floating-cart-footer">
          <div className="cart-footer-info">
            <i className="fas fa-shopping-bag" />
            <span>{cartCount} item{cartCount > 1 ? 's' : ''} in cart</span>
          </div>
          <button
            className="btn cart-footer-btn"
            onClick={() => navigate('/cart')}
          >
            View Cart & Checkout
          </button>
        </div>
      )}
    </>
  );
}
