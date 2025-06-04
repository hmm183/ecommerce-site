import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BannedPage.css';

function BannedPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    navigate('/'); // Redirect to the login/home page
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f8d7da', // Light red background
      color: '#721c24', // Dark red text
      border: '1px solid #f5c6cb',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Access Denied</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
        You have been banned from accessing this resource. or have not logged in!
      </p>
      <p style={{ fontSize: '1rem', marginBottom: '2rem' }}>
        Please contact support if you believe this is an error.
      </p>
      <button
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          backgroundColor: '#dc3545', // Red button
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
      >
        Go to Login Page
      </button>
    </div>
  );
}

export default BannedPage;