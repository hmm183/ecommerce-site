import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './AdminPanel.css';

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0 });
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    description: '',
    price: '',
    image: '',
    sizes: '',
    colors: '',
    category: '',
    stock: '',
    isOnSale: false,
    salePrice: '',
    isFeatured: false
  });
  const [variantStocks, setVariantStocks] = useState({});

  const activeSizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
  const activeColors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : [];

  let combos = [];
  if (activeSizes.length > 0 && activeColors.length > 0) {
    for (const s of activeSizes) {
      for (const c of activeColors) {
        combos.push({ size: s, color: c });
      }
    }
  } else if (activeSizes.length > 0) {
    combos = activeSizes.map(s => ({ size: s, color: 'N/A' }));
  } else if (activeColors.length > 0) {
    combos = activeColors.map(c => ({ size: 'N/A', color: c }));
  }

  const handleVariantStockChange = (size, color, val) => {
    const key = `${size}-${color}`;
    setVariantStocks(prev => ({
      ...prev,
      [key]: val === '' ? '' : Math.max(0, parseInt(val) || 0)
    }));
  };

  const token = localStorage.getItem('token');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploading(true);
    try {
      const res = await fetch(getApiUrl('/api/products/upload'), {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Image upload failed');
      }

      setFormData(prev => ({ ...prev, image: data.imageUrl }));
      alert('Image uploaded successfully to Cloudinary!');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(getApiUrl('/api/products'), { headers: authHeaders });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Fetch products failed', err);
      }
    };
    const loadStats = async () => {
      try {
        const res = await fetch(getApiUrl('/api/admin/stats'), { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Fetch stats failed', err);
      }
    };
    loadProducts();
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const variants = combos.map(combo => ({
      size: combo.size,
      color: combo.color,
      stock: Number(variantStocks[`${combo.size}-${combo.color}`] ?? 0)
    }));

    const computedStock = combos.length > 0
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : Number(formData.stock);

    const payload = {
      ...formData,
      sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
      price: Number(formData.price),
      stock: computedStock,
      isOnSale: Boolean(formData.isOnSale),
      salePrice: formData.isOnSale ? Number(formData.salePrice) : 0,
      isFeatured: Boolean(formData.isFeatured),
      variants
    };
    const method = formData._id ? 'PUT' : 'POST';
    const url = formData._id ? `/api/products/${formData._id}` : '/api/products';

    try {
      const res = await fetch(getApiUrl(url), {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      
      const updatedRes = await fetch(getApiUrl('/api/products'), { headers: authHeaders });
      const updated = await updatedRes.json();
      setProducts(updated);

      const statsRes = await fetch(getApiUrl('/api/admin/stats'), { headers: authHeaders });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      setFormData({
        _id: '',
        name: '',
        description: '',
        price: '',
        image: '',
        sizes: '',
        colors: '',
        category: '',
        stock: '',
        isOnSale: false,
        salePrice: '',
        isFeatured: false
      });
      setVariantStocks({});
    } catch (err) {
      console.error('Save product failed', err);
      alert('Operation failed: ' + err.message);
    }
  };

  const handleEdit = product => {
    setFormData({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
      category: product.category,
      stock: product.stock !== undefined ? product.stock : 50,
      isOnSale: product.isOnSale || false,
      salePrice: product.salePrice !== undefined && product.salePrice !== 0 ? product.salePrice : '',
      isFeatured: product.isFeatured || false
    });

    const newStocks = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(v => {
        newStocks[`${v.size}-${v.color}`] = v.stock;
      });
    }
    setVariantStocks(newStocks);
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(getApiUrl(`/api/products/${id}`), {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setProducts(prev => prev.filter(p => p._id !== id));

      const statsRes = await fetch(getApiUrl('/api/admin/stats'), { headers: authHeaders });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <>
      <Header />
      <div className="admin-panel-container">
        <h1>Admin Control Dashboard</h1>

        {/* 📊 Metrics Dashboard Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <h3>Total Sales Revenue</h3>
            <p style={{ color: 'var(--success)' }}>₹{(stats.totalRevenue || 0).toFixed(2)}</p>
          </div>
          <div className="admin-stat-card">
            <h3>Order Placements</h3>
            <p style={{ color: 'var(--accent-color)' }}>{stats.totalOrders || 0}</p>
          </div>
          <div className="admin-stat-card">
            <h3>Registered Customers</h3>
            <p style={{ color: 'var(--warning)' }}>{stats.totalUsers || 0}</p>
          </div>
        </div>

        {/* Product form card */}
        <div className="glass-card product-form-card">
          <h2>{formData._id ? 'Edit Product Details' : 'Register New Product'}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-grid-full">
              <input
                name="name"
                placeholder="Product Name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-grid-full">
              <input
                name="description"
                placeholder="Product Description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <input
                name="price"
                type="number"
                placeholder="Price (INR)"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <input
                name="stock"
                type="number"
                placeholder="Initial Stock Count"
                value={combos.length > 0 ? combos.reduce((sum, combo) => sum + Number(variantStocks[`${combo.size}-${combo.color}`] ?? 0), 0) : formData.stock}
                onChange={handleChange}
                className="form-input"
                required
                disabled={combos.length > 0}
                style={combos.length > 0 ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              />
              {combos.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '0.25rem', paddingLeft: '0.25rem' }}>
                  Total stock computed from variants
                </div>
              )}
            </div>

            <div>
              <input
                name="sizes"
                placeholder="Sizes (comma separated: S, M, L)"
                value={formData.sizes}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <input
                name="colors"
                placeholder="Colors (comma separated: Blue, Red)"
                value={formData.colors}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {combos.length > 0 && (
              <div className="form-grid-full variant-stock-section">
                <h3 className="variant-stock-title">Variant Stock Levels</h3>
                <p className="variant-stock-subtitle">
                  Specify the available stock for each size and color combination below.
                </p>
                <div className="variant-stock-grid">
                  {combos.map((combo, idx) => {
                    const key = `${combo.size}-${combo.color}`;
                    return (
                      <div key={idx} className="variant-stock-row">
                        <div className="variant-info">
                          <span className="variant-badge size-badge">{combo.size}</span>
                          <span className="variant-separator">/</span>
                          <span className="variant-badge color-badge">{combo.color}</span>
                        </div>
                        <div className="variant-stock-input-wrapper">
                          <input
                            type="number"
                            placeholder="Stock"
                            min="0"
                            value={variantStocks[key] ?? '0'}
                            onChange={(e) => handleVariantStockChange(combo.size, combo.color, e.target.value)}
                            className="form-input variant-stock-input"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-grid-full">
              <input
                name="category"
                placeholder="Product Category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* Sale and Featured Checkboxes */}
            <div className="form-grid-full admin-checkbox-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="isOnSale"
                  checked={formData.isOnSale}
                  onChange={e => setFormData(prev => ({ ...prev, isOnSale: e.target.checked }))}
                />
                <span className="checkbox-label">On Sale</span>
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={e => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                />
                <span className="checkbox-label">Featured Product</span>
              </label>
            </div>

            {formData.isOnSale && (
              <div className="form-grid-full">
                <input
                  name="salePrice"
                  type="number"
                  placeholder="Discounted Sale Price (INR)"
                  value={formData.salePrice}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            )}

            <div className="image-upload-wrapper">
              <label className="file-upload-label">
                <i className="fas fa-cloud-upload-alt" />
                {uploading ? 'Uploading to Cloudinary...' : 'Upload Product Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
              
              {formData.image && (
                <div className="image-preview-block">
                  <img src={formData.image} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginTop: '0.5rem', height: 'auto' }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
              <input type="hidden" name="image" value={formData.image} required />
            </div>

            <div className="form-grid-full" style={{ textAlign: 'center' }}>
              <button type="submit" className="btn btn-primary" style={{ minWidth: '160px' }}>
                {formData._id ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>

        {/* Product Catalog list table */}
        <div className="admin-table-card">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Price</th>
                <th>Category</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td data-label="Product Details" style={{ fontWeight: '600', color: '#fff' }}>{p.name}</td>
                  <td data-label="Price">
                    {p.isOnSale ? (
                      <span>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                          ₹{p.price.toFixed(2)}
                        </span>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                          ₹{p.salePrice.toFixed(2)}
                        </span>
                      </span>
                    ) : (
                      <span>₹{p.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td data-label="Category">{p.category}</td>
                  <td data-label="Type">
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {p.isFeatured && (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontWeight: 'bold' }}>
                          FEATURED
                        </span>
                      )}
                      {p.isOnSale && (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 'bold' }}>
                          SALE
                        </span>
                      )}
                      {!p.isFeatured && !p.isOnSale && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Standard</span>}
                    </div>
                  </td>
                  <td data-label="Actions">
                    <div className="table-actions">
                      <button className="btn btn-secondary" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(p._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
