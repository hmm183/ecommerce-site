import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setToken } from '../utils/auth';

function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};  // email passed from signup

  const [otp, setOTP] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('/verify-otp', {
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
    <div className="vauth-card">
      <h2>Verify OTP</h2>
      <p>Please enter the OTP sent to your email: <b>{email}</b></p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={e => setOTP(e.target.value)}
          required
        />
        <button type="submit" className="btn solid">Verify OTP</button>
      </form>
    </div>
  );
}
export default Verify;
