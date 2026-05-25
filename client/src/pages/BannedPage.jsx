import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BannedPage.css';

function BannedPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="banned-wrapper">
      <div className="banned-card">
        <i className="fas fa-ban banned-icon" />
        <h1>Access Denied</h1>
        <p>You have been banned from accessing this resource, or you have not logged in yet!</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Please contact support if you believe this is an error.
        </p>
        <button onClick={handleLogout} className="btn btn-danger banned-btn">
          Go to Login Page
        </button>
      </div>
    </div>
  );
}

export default BannedPage;