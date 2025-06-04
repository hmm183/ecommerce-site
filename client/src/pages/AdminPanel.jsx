// pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { Link,NavLink } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import './AdminPanel.css';

function AdminHeader() {
  const handleHomeClick = () => {
      removeToken();
    };
  return (
    <header className="header">
      <nav className="nav-bar">
        <Link to="/" className="nav-link" onClick={handleHomeClick}>Home</Link>
        <Link to="/admin" className="nav-link">Add Product</Link>
        <Link to="/orders" className="nav-link">Order Status</Link>
        <Link to="/user-management" className="nav-link">user management</Link>
      </nav>
    </header>
  );
}


export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    description: '',
    price: '',
    image: '',
    sizes: '',
    colors: '',
    category: ''
  });

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  };

  // Fetch all products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products', { headers: authHeaders });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Fetch products failed', err);
      }
    };
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      ...formData,
      sizes: formData.sizes.split(',').map(s => s.trim()),
      colors: formData.colors.split(',').map(c => c.trim())
    };
    const method = formData._id ? 'PUT' : 'POST';
    const url = formData._id ? `/api/products/${formData._id}` : '/api/products';

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      // Refresh list
      const updatedRes = await fetch('/api/products', { headers: authHeaders });
      const updated = await updatedRes.json();
      setProducts(updated);
      // Reset form
      setFormData({ _id: '', name: '', description: '', price: '', image: '', sizes: '', colors: '', category: '' });
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
      sizes: product.sizes.join(', '),
      colors: product.colors.join(', '),
      category: product.category
    });
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="admin-panel">
        <h1>Admin Panel</h1>

        <form onSubmit={handleSubmit} className="product-form">
          <h2>{formData._id ? 'Edit Product' : 'Add New Product'}</h2>
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <input
            name="price"
            type="number"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <input
            name="image"
            placeholder="Image URL"
            value={formData.image}
            onChange={handleChange}
            required
          />
          <input
            name="sizes"
            placeholder="Sizes (comma separated)"
            value={formData.sizes}
            onChange={handleChange}
            required
          />
          <input
            name="colors"
            placeholder="Colors (comma separated)"
            value={formData.colors}
            onChange={handleChange}
            required
          />
          <input
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn solid">
            {formData._id ? 'Update' : 'Create'}
          </button>
        </form>

        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td data-label="Product Name">{p.name}</td>
                <td data-label="Price">₹{p.price}</td>
                <td data-label="Category">{p.category}</td>
                <td data-label="Actions">
                  <button onClick={() => handleEdit(p)}>Edit</button>
                  <button onClick={() => handleDelete(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
