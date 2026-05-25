import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get('orderId');

  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetch(getApiUrl(`/api/orders/${orderId}`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => setOrder(data.order || data))
        .catch(console.error);
    }
  }, [orderId]);

  return (
    <>
      <Header />
      <div className="order-success-wrapper">
        <div className="order-success-card">
          <div className="success-icon-circle">
            <i className="fas fa-check" />
          </div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase! We've sent a confirmation email to your registered email address.</p>

          {orderId ? (
            order ? (
              <>
                <div className="order-details-summary">
                  <div className="order-details-summary-row">
                    <span>Order Ref</span>
                    <span>#{order._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="order-details-summary-row">
                    <span>Total Amount</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="order-details-summary-row">
                    <span>Order Status</span>
                    <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="success-actions">
                  <Link to="/shop" className="btn btn-secondary">Continue Shopping</Link>
                  <Link to="/order-status" className="btn btn-primary">Track Order</Link>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Retrieving purchase details...</p>
            )
          ) : (
            <div style={{ margin: '1.5rem 0' }}>
              <p style={{ color: 'var(--danger)' }}>No order reference ID detected.</p>
              <Link to="/shop" className="btn btn-secondary">Back to Shop</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
