import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './Payment.css';

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Razorpay Checkout SDK script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!state?.orderPayload) {
    return (
      <>
        <Header />
        <div className="no-order-card">
          <i className="fas fa-exclamation-triangle no-order-icon" />
          <h2>No Order Data Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>We couldn't retrieve the checkout details for this payment session.</p>
          <Link to="/checkout" className="btn btn-secondary">Go to Checkout</Link>
        </div>
      </>
    );
  }

  const { orderPayload } = state;

  const handlePayNow = () => {
    if (!window.Razorpay) {
      alert('Razorpay SDK failed to load. Please refresh the page and try again.');
      return;
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_StDPzq5fFb8ioX',
      amount: Math.round(orderPayload.totalAmount * 100),
      currency: 'INR',
      name: 'WOT (World of Tshirts) Store',
      description: 'Order Payment (Test Mode)',
      handler: async function (response) {
        setLoading(true);
        setError('');

        try {
          const res = await fetch(getApiUrl('/api/orders'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              ...orderPayload,
              paymentId: response.razorpay_payment_id
            })
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Failed to record your order on the server.');
          }

          clearCart();
          navigate(`/order-success?orderId=${data.orderId}`, { replace: true });

        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        contact: orderPayload.phone || ''
      },
      theme: {
        color: '#3b82f6'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      alert(`Payment failed: ${response.error.description}`);
    });
    rzp.open();
  };

  return (
    <>
      <Header />
      <div className="payment-wrapper">
        <div className="payment-card">
          <h1>Confirm Payment</h1>
          <p className="payment-subtitle">Please review your billing details to initiate payment.</p>

          {error && <div className="payment-error">{error}</div>}

          <div className="payment-details-table">
            <div className="payment-details-row">
              <span>Items Total</span>
              <span>₹{orderPayload.totalAmount.toFixed(2)}</span>
            </div>
            <div className="payment-details-row">
              <span>Shipping Fee</span>
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>Free</span>
            </div>
            <div className="payment-details-row total-row">
              <span>Total Payable</span>
              <span>₹{orderPayload.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary payment-btn"
            onClick={handlePayNow}
            disabled={loading}
          >
            {loading ? 'Processing Transaction...' : 'Pay Now with Razorpay'}
          </button>
        </div>
      </div>
    </>
  );
}