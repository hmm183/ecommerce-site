// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Ensure this is installed: npm install jwt-decode

const AuthContext = createContext(null);

// Synchronously extract and store OAuth token from URL before initial render to prevent race conditions
const searchParams = new URLSearchParams(window.location.search);
const oauthToken = searchParams.get('token');
if (oauthToken) {
  localStorage.setItem('token', oauthToken);
  // Clean the URL query parameters
  searchParams.delete('token');
  const newSearch = searchParams.toString();
  const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoize checkAuthStatus to prevent unnecessary re-creations
  const checkAuthStatus = useCallback(() => {
    setLoading(true); // Start loading when checking status
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          console.warn('Token expired. Logging out.');
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser({
            id: decoded.id || decoded._id,
            email: decoded.email,
            role: decoded.role,
            banned: decoded.banned,
            token: token
          });
        }
      } catch (error) {
        console.error('Invalid token or decoding error:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false); // End loading after check
  }, []); // Empty dependency array, so checkAuthStatus is stable

  // Effect to run on initial mount and listen for localStorage changes
  useEffect(() => {
    // Initial check when the component mounts
    checkAuthStatus();

    // The 'storage' event listener is primarily for cross-tab communication.
    // For same-tab updates, explicit calls (like in Auth.jsx or App.jsx) are more reliable.
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]); // `checkAuthStatus` is stable due to useCallback

  const login = (token, userDataFromBackend) => {
    localStorage.setItem('token', token);
    // Explicitly call checkAuthStatus immediately after setting token
    // This ensures AuthContext state updates even without a 'storage' event or refresh.
    checkAuthStatus();
    // Optional: if your backend sends full user data, you can store it too
    // localStorage.setItem('user_data_from_backend', JSON.stringify(userDataFromBackend));
  };

  const logout = () => {
    localStorage.removeItem('token');
    // localStorage.removeItem('user_data_from_token');
    setUser(null); // Clear state immediately
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isBanned = user?.banned === true;

  const authContextValue = {
    user,
    isAuthenticated,
    isAdmin,
    isBanned,
    loading,
    login,
    logout,
    checkAuthStatus // <--- NEW: Expose checkAuthStatus
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};