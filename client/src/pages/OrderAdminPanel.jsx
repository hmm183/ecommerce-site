import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './OrderAdminPanel.css';

export default function OrderAdminPanel() {
  const token = localStorage.getItem('token');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetch(getApiUrl('/api/orders'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const formatted = Array.isArray(data) ? data : data.orders || [];
        setOrders(formatted);
      })
      .catch(err => console.error('Load orders failed', err))
      .finally(() => setLoading(false));
  }, [token]);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Status update failed');
      const { order } = await res.json();
      setOrders(os => os.map(o => o._id === order._id ? order : o));
    } catch (err) {
      alert(err.message);
    }
  };

  const matchesSearch = (order) => {
    const query = searchQuery.toLowerCase();
    return (
      order._id.toLowerCase().includes(query) ||
      (order.user?.email?.toLowerCase().includes(query)) ||
      (order.user?.username?.toLowerCase().includes(query)) ||
      order.user?._id?.toLowerCase().includes(query)
    );
  };

  const matchesDate = (order) => {
    if (!filterDate) return true;
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return filterDate === 'today' ? orderDate === today : orderDate === filterDate;
  };

  const filteredOrders = orders.filter(o => matchesSearch(o) && matchesDate(o));
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading order logs...
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="order-admin-container">
        <h1>Order Administration</h1>

        {/* 🔍 Filters card */}
        <div className="admin-filters-card">
          <input
            type="text"
            placeholder="Search by Order ID, Email, Username..."
            value={searchQuery}
            className="form-input"
            onChange={e => setSearchQuery(e.target.value)}
          />
          <input
            type="date"
            className="form-input"
            value={filterDate === 'today' ? '' : filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={() => setFilterDate('today')}>
            Today
          </button>
          <button className="btn btn-danger" onClick={() => { setFilterDate(''); setSearchQuery(''); }}>
            Reset
          </button>
        </div>

        {/* 📋 Orders Catalog Table */}
        <div className="admin-table-card">
          {filteredOrders.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>No orders found matching criteria.</p>
          ) : (
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer Account</th>
                  <th>Total Billing</th>
                  <th>Delivery Status</th>
                  <th>Modify Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o._id}>
                    <td data-label="Order Reference" style={{ fontWeight: '600', color: '#fff' }}>
                      #{o._id.slice(-6).toUpperCase()}
                    </td>
                    <td data-label="Customer Account">
                      {o.user ? (o.user.email || o.user.username || o.user._id) : 'Guest user'}
                    </td>
                    <td data-label="Total Billing" style={{ fontWeight: '600' }}>
                      ₹{o.totalAmount.toFixed(2)}
                    </td>
                    <td data-label="Delivery Status">
                      <span style={{ 
                        color: o.status === 'Delivered' ? 'var(--success)' : o.status === 'Cancelled' ? 'var(--danger)' : 'var(--warning)',
                        fontWeight: '600'
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td data-label="Modify Status">
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o._id, e.target.value)}
                        className="checkout-select"
                        style={{ padding: '0.4rem 0.75rem', height: 'auto', fontSize: '0.85rem' }}
                      >
                        {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 📊 Revenue Footer Card */}
        <div className="revenue-card">
          <span>Filtered Revenue Total:</span>
          <span className="revenue-value">₹{totalRevenue.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}
