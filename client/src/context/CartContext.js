// client/src/context/CartContext.js
import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const token = localStorage.getItem('token');

  // 1) Load & merge cart on mount or when token changes
  useEffect(() => {
    const fetchAndMergeCart = async () => {
      // always read localStorage first
      let local = [];
      try {
        const stored = localStorage.getItem('cartItems');
        local = stored ? JSON.parse(stored) : [];
      } catch {
        local = [];
      }

      // no token: just use local
      if (!token) {
        setCartItems(local);
        console.log('Using localStorage cart (no token).');
        return;
      }

      // token exists => fetch backend
      let backend = [];
      let backendOK = false;
      try {
        const res = await fetch('/api/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          backend = Array.isArray(data)
            ? data.map(item => ({
                _id: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color
              }))
            : [];
          backendOK = true;
          console.log('Fetched cart from backend:', backend);
        }
      } catch (err) {
        console.warn('Backend fetch failed:', err);
      }

      let merged;
      if (backendOK && backend.length > 0) {
        // backend has items → use backend
        merged = backend;
      } else if (local.length > 0) {
        // backend empty but local has items → push local up
        merged = local;
        try {
          const res = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(local)
          });
          if (res.ok) console.log('Merged local cart into backend.');
        } catch (err) {
          console.error('Failed to merge local into backend:', err);
        }
      } else {
        // both empty
        merged = [];
      }

      setCartItems(merged);
      localStorage.setItem('cartItems', JSON.stringify(merged));
    };

    fetchAndMergeCart();
  }, [token]);

  // 2) Sync cart → localStorage & backend whenever cartItems change
  useEffect(() => {
    // Always write local
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // If user logged in, persist to backend
    if (token) {
      (async () => {
        try {
          const res = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(cartItems)
          });
          if (res.ok) {
            console.log('Synced cart to backend.');
          }
        } catch (err) {
          console.error('Failed to sync cart:', err);
        }
      })();
    }
  }, [cartItems, token]);

  // 3) Cart operations
  const addToCart = item => {
    if (!item || !item._id) return;
    setCartItems(prev => {
      const exists = prev.find(
        i => i._id === item._id && i.size === item.size && i.color === item.color
      );
      if (exists) {
        return prev.map(i =>
          i._id === item._id && i.size === item.size && i.color === item.color
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = id =>
    setCartItems(prev => prev.filter(i => i._id !== id));

  const increaseQty = (id, size, color) =>
    setCartItems(prev =>
      prev.map(i =>
        i._id === id && i.size === size && i.color === color
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    );

  const decreaseQty = (id, size, color) =>
    setCartItems(prev =>
      prev
        .map(i =>
          i._id === id && i.size === size && i.color === color
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter(i => i.quantity > 0)
    );

  // 4) Clear
  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
