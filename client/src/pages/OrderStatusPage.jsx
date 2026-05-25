import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './OrderStatusPage.css';

function OrderStatusPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/orders/me'), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        } else if (res.status === 304) {
          console.log('Orders not modified, using existing data.');
        } else if (res.status === 404) {
          setOrders([]);
        } else if (res.status === 401 || res.status === 403) {
          setError('Unauthorized. Please log in again.');
          localStorage.removeItem('token');
          navigate('/');
        } else {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            setError(errorData.message || `Failed to fetch orders.`);
          } else {
            const textError = await res.text();
            console.error('Fetch orders error body:', textError);
            setError(`Failed to fetch orders.`);
          }
        }
      } catch (err) {
        setError('Network error: Could not connect to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading your orders...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div style={{ padding: '5rem', color: 'var(--danger)', textAlign: 'center' }}>
          Error: {error}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="order-status-container">
        <h1>Your Orders</h1>
        {orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
            You have not placed any orders yet.
          </p>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-card-header">
                  <div className="order-card-id">
                    <span>Order Ref:</span> #{order._id.slice(-6).toUpperCase()}
                  </div>
                  <div className="order-card-date">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-card-body-row">
                    <span>Total Paid</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="order-card-body-row">
                    <span>Status</span>
                    <span className={`status-badge ${order.status.toLowerCase().replace(/\s/g, '-')}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="order-items-heading">Items Ordered</div>
                <ul className="order-items-list">
                  {order.items.map((item, index) => (
                    <li key={index} className="order-item-row">
                      <div>
                        <span className="order-item-desc">
                          {item.quantity} x {item.product ? item.product.name : item.name}
                        </span>
                        {(item.size || item.color) && (
                          <span className="order-item-variants">
                            ({item.size && `Size: ${item.size}`}{item.size && item.color && ', '}{item.color && `Color: ${item.color}`})
                          </span>
                        )}
                      </div>
                      <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
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