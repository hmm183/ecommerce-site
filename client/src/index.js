// client/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext'; // <--- NEW: Import AuthProvider
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider should wrap CartProvider to make auth context available to CartProvider if needed */}
      <AuthProvider> {/* <--- NEW: Wrap with AuthProvider */}
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider> {/* <--- NEW: Close AuthProvider */}
    </BrowserRouter>
  </React.StrictMode>
);