import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get('orderId');

  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => setOrder(data.order || data))
        .catch(console.error);
    }
  }, [orderId]);

  // In client/src/pages/OrderSuccess.jsx, inside the return statement:
  return (
    <div className="order-success-container"> {/* Apply the main container class */}
      <h1>Thank you for your purchase!</h1>
      {orderId ? (
        order ? (
          <>
            <p>Your order <strong>#{order._id.slice(-6)}</strong> has been placed.</p>
            <p>Total: <strong>₹{order.totalAmount.toFixed(2)}</strong></p>
            <p>Status: <strong>{order.status}</strong></p>
            <Link to="/shop" className="continue-shopping-btn">Continue Shopping</Link> {/* Apply button class */}
          </>
        ) : (
          <p>Loading order details…</p>
        )
      ) : (
        <p>No order ID provided.</p>
      )}
    </div>
  );
}
