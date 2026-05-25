import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Review states
  const token = localStorage.getItem('token');
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTextInput, setReviewTextInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    console.log('▶️ Fetching Product ID:', id);
    fetch(getApiUrl(`/api/products/${id}`))
      .then(res => {
        if (!res.ok) throw new Error('Product not found.');
        return res.json();
      })
      .then(data => {
        setProduct(data);
      })
      .catch(err => {
        console.error('❌ Error fetching product:', err);
        setProduct({ error: true });
      });
  }, [id]);

  const handleAddToCart = () => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;
    
    if ((hasSizes && !selectedSize) || (hasColors && !selectedColor)) {
      const missingFields = [];
      if (hasSizes && !selectedSize) missingFields.push('size');
      if (hasColors && !selectedColor) missingFields.push('color');
      alert(`Please select a ${missingFields.join(' and ')}.`);
      return;
    }
    
    // If product is on sale, use salePrice for checkout
    const checkoutPrice = product.isOnSale ? product.salePrice : product.price;

    addToCart({ 
      ...product, 
      price: checkoutPrice, // ensure sale price is mapped to cart item
      size: selectedSize || 'N/A', 
      color: selectedColor || 'N/A' 
    });
    alert('Product added to cart');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      return alert('You must be logged in to write a review.');
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(getApiUrl(`/api/products/${id}/rate`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: ratingInput,
          reviewText: reviewTextInput
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review.');

      setProduct(data);
      setReviewTextInput('');
      alert('Thank you for rating this product!');
    } catch (err) {
      alert('Rating submission failed: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (product === null) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          Loading product details...
        </div>
      </>
    );
  }

  if (product.error) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--danger)' }}>
          <h2>Product Not Found</h2>
          <p style={{ marginTop: '1rem' }}><Link to="/shop" className="btn btn-secondary">Back to Shop</Link></p>
        </div>
      </>
    );
  }

  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasColors = product.colors && product.colors.length > 0;
  const isSelectionComplete = (!hasSizes || selectedSize) && (!hasColors || selectedColor);

  const selectedVariant = (isSelectionComplete && product.variants && product.variants.length > 0)
    ? product.variants.find(v => {
        const sizeMatch = !hasSizes || v.size.toLowerCase() === selectedSize.toLowerCase();
        const colorMatch = !hasColors || v.color.toLowerCase() === selectedColor.toLowerCase();
        return sizeMatch && colorMatch;
      })
    : null;

  const currentStock = selectedVariant !== null && selectedVariant !== undefined
    ? selectedVariant.stock
    : product.stock;

  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= 10;
  const isRecommended = product.rating && product.rating > 4.5;
  const isProductCompletelyOutOfStock = product.stock === 0;

  return (
    <>
      <Header />
      <div className="product-detail-container">
        <div className="product-detail-card">
          <div className="product-detail-image-section">
            <div className="product-detail-image-wrapper" style={{ position: 'relative' }}>
              {/* Image Badges */}
              <div className="badge-container">
                {product.isOnSale && <span className="card-badge sale-badge">Sale</span>}
                {product.isFeatured && <span className="card-badge featured-badge">Featured</span>}
                {isRecommended && <span className="card-badge recommended-badge">★ Recommended</span>}
              </div>
              <img src={product.image} alt={product.name} />
            </div>
          </div>

          <div className="product-detail-info-section">
            <span className="product-detail-category">{product.category || 'Apparel'}</span>
            <h1 className="product-detail-title">{product.name}</h1>
            
            {/* Star Rating Display */}
            <div className="rating-bar">
              {product.reviewCount > 0 ? (
                <>
                  <span className="rating-stars">
                    {'★'.repeat(Math.round(product.rating))}
                    {'☆'.repeat(5 - Math.round(product.rating))}
                  </span>
                  <span className="rating-count">
                    {product.rating} ({product.reviewCount} customer reviews)
                  </span>
                </>
              ) : (
                <span className="rating-count" style={{ color: 'var(--text-muted)' }}>
                  No reviews yet
                </span>
              )}
            </div>

            <div className="product-detail-price">
              {product.isOnSale ? (
                <>
                  <span className="detail-price-cross">₹{product.price}</span>
                  <span className="detail-price-sale">₹{product.salePrice}</span>
                </>
              ) : (
                <span>₹{product.price}</span>
              )}
            </div>

            <p className="product-detail-description">{product.description}</p>

            {/* Stock Level Warning Indicator */}
            <div className={`stock-status-badge ${isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-in'}`}>
              {isOutOfStock ? (
                <>{isSelectionComplete ? `❌ Out of Stock for ${selectedSize} / ${selectedColor}` : '❌ Out of Stock'}</>
              ) : isLowStock ? (
                <>⚠️ Only {currentStock} left in stock {isSelectionComplete ? `for ${selectedSize} / ${selectedColor}` : ''} - order soon!</>
              ) : (
                <>✓ In Stock ({currentStock} available {isSelectionComplete ? `for ${selectedSize} / ${selectedColor}` : ''})</>
              )}
            </div>

            <div className="selectors-container">
              {/* Interactive Size Pills */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="selector-group">
                  <span className="selector-label">Select Size</span>
                  <div className="pill-grid">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        className={`pill-option ${selectedSize === size ? 'selected' : ''}`}
                        onClick={() => setSelectedSize(size)}
                        disabled={isProductCompletelyOutOfStock}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Color Pills */}
              {product.colors && product.colors.length > 0 && (
                <div className="selector-group">
                  <span className="selector-label">Select Color</span>
                  <div className="pill-grid">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`pill-option ${selectedColor === color ? 'selected' : ''}`}
                        onClick={() => setSelectedColor(color)}
                        disabled={isProductCompletelyOutOfStock}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary add-to-cart-btn" 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* 💬 CUSTOMER REVIEWS & RATING FORM SECTION */}
        <section className="reviews-section">
          <h2 className="reviews-heading">Customer Reviews</h2>
          <div className="reviews-container">
            {/* Left: Review Submission Form */}
            <div className="review-form-card">
              <h3>Write a Customer Review</h3>
              {token ? (
                <form onSubmit={handleSubmitReview}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Your Rating:
                  </div>
                  <div className="star-selector">
                    {[1, 2, 3, 4, 5].map(stars => (
                      <button
                        key={stars}
                        type="button"
                        className={`star-btn ${ratingInput >= stars ? 'active' : ''}`}
                        onClick={() => setRatingInput(stars)}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Tell us what you liked or disliked about this product (optional)..."
                    className="form-input review-textarea"
                    value={reviewTextInput}
                    onChange={e => setReviewTextInput(e.target.value)}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary submit-review-btn"
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting review...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Please <Link to="/" style={{ color: 'var(--accent-color)', fontWeight: '600' }}>log in</Link> to rate and review this product.
                </p>
              )}
            </div>

            {/* Right: Review History List */}
            <div className="reviews-list-wrapper">
              <h3>Feedback History</h3>
              {!product.ratings || product.ratings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', paddingTop: '1rem' }}>
                  No customer reviews have been written for this product yet.
                </p>
              ) : (
                product.ratings.map((rev, index) => (
                  <div key={rev._id || index} className="review-item">
                    <div className="review-item-header">
                      <span className="review-item-user">
                        {rev.user?.username || 'Verified Customer'}
                      </span>
                      <span className="review-item-date">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="review-item-stars">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </div>
                    {rev.reviewText && (
                      <p className="review-item-text">{rev.reviewText}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}