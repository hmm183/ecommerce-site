// client/src/pages/Payment.jsx
import React, { useContext, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Payment.css'; // Import the CSS file for styling

export default function Payment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If someone tries to access /payment directly without order data
  if (!state?.orderPayload) {
    return (
      <div className="no-order-data">
        <h2>No order data found.</h2>
        <Link to="/checkout" className="go-to-checkout-link">Go to Checkout</Link>
      </div>
    );
  }

  const { orderPayload } = state;

  const handleConfirm = async () => {
    setLoading(true);
    setError(''); // Clear any previous errors

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        // If the server response is not okay (e.g., 4xx, 5xx status codes)
        throw new Error(data.message || 'Order placement failed.');
      }

      // 1) Clear the client-side cart after a successful order
      clearCart();

      // 2) Redirect to a success page, passing the new order ID
      navigate(`/order-success?orderId=${data.orderId}`, { replace: true });

    } catch (err) {
      // Catch network errors or errors thrown from the response handling
      setError(err.message);
    } finally {
      setLoading(false); // Always stop loading, regardless of success or failure
    }
  };

  return (
    <>
      <div className="payment-container">
        <h1>Confirm Your Payment</h1>
        <p>Please confirm your payment of <strong>₹{orderPayload.totalAmount.toFixed(2)}</strong>.</p>

        {error && <p className="error-message">{error}</p>} {/* Display error messages */}

        <button
          className="btn solid" // Assuming 'btn solid' provides your base button styles
          onClick={handleConfirm}
          disabled={loading} // Disable button while processing
        >
          {loading ? 'Processing…' : 'Confirm Payment'}
        </button>
      </div>
    </>
  );
}