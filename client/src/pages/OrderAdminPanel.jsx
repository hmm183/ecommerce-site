import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import './OrderAdminPanel.css';

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

export default function OrderAdminPanel() {
  const token = localStorage.getItem('token');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetch('/api/orders', {
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
      const res = await fetch(`/api/orders/${orderId}/status`, {
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

  // 🧠 Utility to match search query
  const matchesSearch = (order) => {
    const query = searchQuery.toLowerCase();
    return (
      order._id.toLowerCase().includes(query) ||
      (order.user?.email?.toLowerCase().includes(query)) ||
      (order.user?.username?.toLowerCase().includes(query)) ||
      order.user?._id?.toLowerCase().includes(query)
    );
  };

  // 🧠 Utility to match date filter
  const matchesDate = (order) => {
    if (!filterDate) return true;
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return filterDate === 'today' ? orderDate === today : orderDate === filterDate;
  };

  // 🧠 Filtered and searched list
  const filteredOrders = orders.filter(o => matchesSearch(o) && matchesDate(o));

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (loading) return <div style={{ padding: 20 }}>Loading orders…</div>;

  // In pages/OrderAdminPanel.jsx, inside the return statement:
return (
  <>
    <AdminHeader />
    <div className="order-admin-panel"> {/* Apply main container class */}
      <h1>Order Administration</h1>

      {/* 🔍 Filters */}
      <div className="filters-container"> {/* Apply filters container class */}
        <input
          type="text"
          placeholder="Search by Order ID, Email, Username"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          // Remove inline style: style={{ padding: 6, flex: 2 }}
        />
        <input
          type="date"
          onChange={e => setFilterDate(e.target.value)}
          // Remove inline style: style={{ padding: 6 }}
        />
        <button onClick={() => setFilterDate('today')}> {/* Remove inline style */}
          Today
        </button>
        <button onClick={() => { setFilterDate(''); setSearchQuery(''); }}> {/* Remove inline style */}
          Reset
        </button>
      </div>

      {/* 📋 Orders Table */}
      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="order-table"> {/* Apply table class */}
          <thead>
            <tr> {/* Remove inline style: style={{ borderBottom: '2px solid #333' }} */}
              <th>ID</th>
              <th>User</th>
              <th>Total</th>
              <th>Status</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => (
              <tr key={o._id}> {/* Remove inline style: style={{ borderBottom: '1px solid #ccc' }} */}
                <td data-label="Order ID">{o._id.slice(-6)}</td> {/* Add data-label */}
                <td data-label="User">{o.user ? (o.user.username || o.user.email || o.user._id) : 'N/A'}</td> {/* Add data-label */}
                <td data-label="Total">₹{o.totalAmount.toFixed(2)}</td> {/* Add data-label */}
                <td data-label="Status">{o.status}</td> {/* Add data-label */}
                <td data-label="Change Status"> {/* Add data-label */}
                  <select
                    value={o.status}
                    onChange={e => updateStatus(o._id, e.target.value)}
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

      {/* 📊 Revenue Footer */}
      <div className="revenue-footer"> {/* Apply revenue footer class */}
        Total Revenue: ₹{totalRevenue.toFixed(2)}
      </div>
    </div>
  </>
);
}
