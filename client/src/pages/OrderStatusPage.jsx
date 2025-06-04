// client/src/pages/OrderStatusPage.jsx
import React, { useContext,useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { Link} from 'react-router-dom';
import { removeToken } from '../utils/auth';
import './OrderStatusPage.css';

// Your existing Header component (assuming it's defined correctly)
function Header() {
  const { cartItems } = useContext(CartContext);
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const handleHomeClick = () => {
    // This looks like a logout action on Home click, be mindful if that's intended
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

function OrderStatusPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('/api/orders/me', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) { // This covers 2xx status codes (like 200 OK)
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
          console.log('User orders fetched:', data);
        } else if (res.status === 304) { // <--- NEW: Explicitly handle 304 Not Modified
          console.log('Orders not modified, using existing data.');
          // When 304, it means the data hasn't changed.
          // The current 'orders' state (from a previous successful fetch or initial empty) should be correct.
          // No need to set orders again from response.
        } else if (res.status === 404) {
          setOrders([]); // No orders found for this user
          console.log('No orders found for this user.');
        } else if (res.status === 401 || res.status === 403) {
          setError('Unauthorized. Please log in again.');
          localStorage.removeItem('token'); // Clear invalid token
          navigate('/login');
        } else {
          // For other error statuses (e.g., 500), try to parse JSON, but handle non-JSON responses gracefully
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            setError(errorData.message || `Failed to fetch orders (Status: ${res.status}).`);
            console.error('Failed to fetch orders:', errorData);
          } else {
            // Fallback for non-JSON error responses (like HTML error pages, which might still happen for some 5xx)
            const textError = await res.text();
            setError(`Failed to fetch orders (Status: ${res.status}). Server responded with: ${textError.substring(0, 100)}...`);
            console.error('Failed to fetch orders, non-JSON response:', textError);
          }
        }
      } catch (err) {
        setError('Network error: Could not connect to server.');
        console.error('Network error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [navigate]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your orders...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>Error: {error}</div>;
  }

  // In client/src/pages/OrderStatusPage.jsx, inside the return statement:
  return (
    <>
      <Header />
      <div className="order-status-page"> {/* Apply main container class */}
        <h1>Your Order Status</h1>
        {orders.length === 0 ? (
          <p>You have not placed any orders yet.</p>
        ) : (
          <div className="orders-list"> {/* Apply orders list class */}
            {orders.map(order => (
              <div key={order._id} className="order-card"> {/* Apply order card class */}
                <h3>Order ID: {order._id.slice(-8)}</h3>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> ₹{order.totalAmount.toFixed(2)}</p>
                <p>
                  <strong>Status:</strong>
                  <span className={`status-${order.status.toLowerCase().replace(/\s/g, '-')}`}> {/* Apply dynamic status class */}
                    {order.status}
                  </span>
                </p>
                <h4>Items:</h4>
                <ul> {/* Remove inline style: style={{ listStyleType: 'none', padding: 0 }} */}
                  {order.items.map((item, index) => (
                    <li key={index}> {/* Remove inline style: style={{ marginBottom: '5px' }} */}
                      {item.quantity} x {item.product ? item.product.name : item.name} (₹{item.price.toFixed(2)})
                      {item.size && ` - Size: ${item.size}`}
                      {item.color && ` - Color: ${item.color}`}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default OrderStatusPage;