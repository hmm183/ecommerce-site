// client/src/context/CartContext.js
import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../utils/api';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const { user, loading: authLoading } = useAuth();
  const token = user?.token;

  // Track whether initial load from backend/localStorage is complete.
  // This prevents the sync effect from overwriting the real cart with [] on mount.
  const initialLoadDone = useRef(false);
  // Track the last synced JSON to avoid redundant POSTs
  const lastSyncedJson = useRef('');

  // 1) Load & merge cart on mount or when token changes — but only after auth is resolved
  useEffect(() => {
    // Don't run until AuthContext has finished its loading phase
    if (authLoading) return;

    const fetchAndMergeCart = async () => {
      // Always read localStorage first
      let local = [];
      try {
        const stored = localStorage.getItem('cartItems');
        local = stored ? JSON.parse(stored) : [];
      } catch {
        local = [];
      }

      // No token: just use local
      if (!token) {
        setCartItems(local);
        lastSyncedJson.current = JSON.stringify(local);
        initialLoadDone.current = true;
        return;
      }

      // Token exists => fetch backend cart
      let backend = [];
      let backendOK = false;
      try {
        const res = await fetch(getApiUrl('/api/cart'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          backend = Array.isArray(data)
            ? data
                .filter(item => item.product) // guard against deleted products
                .map(item => ({
                  _id: item.product._id,
                  name: item.product.name,
                  price: item.product.isOnSale ? item.product.salePrice : item.product.price,
                  image: item.product.image,
                  quantity: item.quantity,
                  size: item.size,
                  color: item.color
                }))
            : [];
          backendOK = true;
        }
      } catch (err) {
        console.warn('Backend cart fetch failed:', err);
      }

      let merged;
      if (backendOK && backend.length > 0) {
        // Backend has items → use backend as source of truth
        merged = backend;
      } else if (local.length > 0) {
        // Backend empty but local has items → push local items up to server
        merged = local;
        if (token) {
          try {
            await fetch(getApiUrl('/api/cart'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(local)
            });
          } catch (err) {
            console.error('Failed to merge local cart to backend:', err);
          }
        }
      } else {
        merged = [];
      }

      setCartItems(merged);
      localStorage.setItem('cartItems', JSON.stringify(merged));
      lastSyncedJson.current = JSON.stringify(merged);
      initialLoadDone.current = true;
    };

    // Reset so we don't sync stale state while loading
    initialLoadDone.current = false;
    fetchAndMergeCart();
  }, [token, authLoading]);

  // 2) Sync cart → localStorage & backend whenever cartItems changes
  //    BUT only after the initial load is complete (to avoid overwriting with [])
  useEffect(() => {
    if (!initialLoadDone.current) return;

    const currentJson = JSON.stringify(cartItems);

    // Skip if nothing actually changed (prevents redundant network calls)
    if (currentJson === lastSyncedJson.current) return;
    lastSyncedJson.current = currentJson;

    // Always persist to localStorage
    localStorage.setItem('cartItems', currentJson);

    // If logged in, persist to backend for cross-device sync
    if (token) {
      (async () => {
        try {
          await fetch(getApiUrl('/api/cart'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: currentJson
          });
        } catch (err) {
          console.error('Failed to sync cart to backend:', err);
        }
      })();
    }
  }, [cartItems, token]);

  // 3) Cart operations
  const addToCart = useCallback(item => {
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
  }, []);

  const removeFromCart = useCallback((id, size, color) =>
    setCartItems(prev => prev.filter(i => !(i._id === id && i.size === size && i.color === color))), []);

  const increaseQty = useCallback((id, size, color) =>
    setCartItems(prev =>
      prev.map(i =>
        i._id === id && i.size === size && i.color === color
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    ), []);

  const decreaseQty = useCallback((id, size, color) =>
    setCartItems(prev =>
      prev
        .map(i =>
          i._id === id && i.size === size && i.color === color
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter(i => i.quantity > 0)
    ), []);

  // 4) Clear cart
  const clearCart = useCallback(() => setCartItems([]), []);

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
