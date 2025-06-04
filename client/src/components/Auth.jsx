import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode'; // <--- IMPORT jwtDecode

function Auth() {
  const [isSignUp, setSignUp] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', phno: '', password: '' });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginChange = e =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleSignupChange = e =>
    setSignupData({ ...signupData, [e.target.name]: e.target.value });

  const handleLogin = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json(); // This data contains 'token' and 'message', but NO 'user' object

      if (res.ok) {
        let decodedUser = {};
        try {
            // Decode the token to get user details including role and banned status
            const decodedToken = jwtDecode(data.token);
            decodedUser = {
                id: decodedToken.id, // Assuming 'id' is in JWT payload
                email: decodedToken.email, // Assuming 'email' is in JWT payload
                role: decodedToken.role,
                banned: decodedToken.banned
            };
        } catch (decodeError) {
            console.error('Error decoding JWT token:', decodeError);
            alert('Login successful, but could not read user data. Please try again.');
            return; // Stop execution if token cannot be decoded
        }

        // Call the login function from AuthContext with the token and decoded user data
        login(data.token, decodedUser); // <--- Pass decodedUser here

        // Now, we can immediately navigate based on the decoded role
        if (decodedUser.role === 'admin') { // <--- Use decodedUser.role
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

  const [otpLoading, setOtpLoading] = useState(false);

  const handleSignup = async e => {
    e.preventDefault();
    if (otpLoading) return;

    setOtpLoading(true);
    try {
      const res = await fetch('/request-otp', {
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
    <div className={`container ${isSignUp ? 'sign-up-mode' : ''}`}>
      <div className="forms-container">
        <div className="signin-signup">
          <form onSubmit={handleLogin} className="sign-in-form">
            <h2 className="title">Login</h2>
            <div className="input-field">
              <i className="fas fa-envelope" />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock" />
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
              />
            </div>
            <button type="submit" className="btn solid">Login</button>
            <a href="/auth/google" className="btn transparent">
              <img src="https://i.postimg.cc/3NGKBY4V/google-icon.png" alt="Google" className="icon-img" />
              Sign in with Google
            </a>
          </form>

          <form onSubmit={handleSignup} className="sign-up-form">
            <h2 className="title">Sign up</h2>
            <div className="input-field">
              <i className="fas fa-user" />
              <input
                type="text"
                placeholder="Name"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-envelope" />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-phone" />
              <input
                type="text"
                placeholder="Phone Number"
                name="phno"
                value={signupData.phno}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className="input-field">
              <i className="fas fa-lock" />
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
              />
            </div>
            <button type="submit" className="btn" disabled={otpLoading}>{otpLoading ? 'Sending OTP...' : 'Request OTP'}</button>
          </form>
        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>New here?</h3>
            <p>Enter your details to sign up.</p>
            <button className="btn transparent" onClick={() => setSignUp(true)}>
              Sign up
            </button>
          </div>
        </div>
        <div className="panel right-panel">
          <div className="content">
            <h3>Already have an account?</h3>
            <p>Click below to login.</p>
            <button className="btn transparent" onClick={() => setSignUp(false)}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;