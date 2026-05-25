import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth';
import { getApiUrl } from '../utils/api';
import './Auth.css'; // Reuse glassmorphic auth styles

function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};

  const [otp, setOTP] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch(getApiUrl('/api/auth/verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      alert(data.message);
      if (email === 'towmaintainer@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/shop');
      }
    } else {
      alert(data.message || 'Verification failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">Verify <span>OTP</span></h1>
          <p className="auth-subtitle">Please enter the OTP sent to <b>{email}</b></p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">OTP Code</label>
            <div className="auth-input-wrapper">
              <i className="fas fa-key auth-icon" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                className="auth-input"
                style={{ textAlign: 'center', letterSpacing: '0.1em' }}
                value={otp}
                onChange={e => setOTP(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-btn">Verify OTP</button>
        </form>
      </div>
    </div>
  );
}

export default Verify;
