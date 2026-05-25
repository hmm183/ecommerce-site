import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { getApiUrl } from '../utils/api';
import './Auth.css';

function Auth() {
  const [isSignUp, setSignUp] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', phno: '', password: '' });
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginChange = e =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleSignupChange = e =>
    setSignupData({ ...signupData, [e.target.name]: e.target.value });

  const handleLogin = async e => {
    e.preventDefault();
    try {
      const res = await fetch(getApiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();

      if (res.ok) {
        let decodedUser = {};
        try {
          const decodedToken = jwtDecode(data.token);
          decodedUser = {
            id: decodedToken.id,
            email: decodedToken.email,
            role: decodedToken.role,
            banned: decodedToken.banned
          };
        } catch (decodeError) {
          console.error('Error decoding JWT token:', decodeError);
          alert('Login successful, but could not read user data. Please try again.');
          return;
        }

        login(data.token, decodedUser);

        if (decodedUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/shop');
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error or server unreachable.');
    }
  };

  const handleSignup = async e => {
    e.preventDefault();
    if (otpLoading) return;

    setOtpLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/request-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        navigate('/verify', { state: { email: signupData.email } });
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">WORLD OF<span>TSHIRTS</span></h1>
          <p className="auth-subtitle">Premium Curated E-Commerce Platform</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${!isSignUp ? 'active' : ''}`} 
            onClick={() => setSignUp(false)}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${isSignUp ? 'active' : ''}`} 
            onClick={() => setSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        {!isSignUp ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <i className="fas fa-envelope auth-icon" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  name="email"
                  className="auth-input"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <i className="fas fa-lock auth-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  className="auth-input"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-btn">Login</button>
            
            <div className="auth-divider">or</div>

            <a href={getApiUrl('/auth/google')} className="google-btn">
              <img src="https://i.postimg.cc/3NGKBY4V/google-icon.png" alt="Google" />
              Continue with Google
            </a>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="auth-input-group">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <i className="fas fa-user auth-icon" />
                <input
                  type="text"
                  placeholder="John Doe"
                  name="name"
                  className="auth-input"
                  value={signupData.name}
                  onChange={handleSignupChange}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <i className="fas fa-envelope auth-icon" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  name="email"
                  className="auth-input"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Phone Number</label>
              <div className="auth-input-wrapper">
                <i className="fas fa-phone auth-icon" />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  name="phno"
                  className="auth-input"
                  value={signupData.phno}
                  onChange={handleSignupChange}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <i className="fas fa-lock auth-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  className="auth-input"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-btn" disabled={otpLoading}>
              {otpLoading ? 'Sending OTP...' : 'Request OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Auth;