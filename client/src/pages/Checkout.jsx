import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems } = useContext(CartContext);
  const token = localStorage.getItem('token');
  const totalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Guard: Redirect to /shop if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems, navigate]);

  // 1) Order mode
  const [mode, setMode] = useState('self');
  const [recipientName, setRecipientName] = useState('');

  // 2) Phones
  const [phonesList, setPhonesList] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [isAddingNewPhone, setIsAddingNewPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');

  // 3) Addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState('');

  // Fetch saved phones whenever mode changes
  useEffect(() => {
    if (cartItems.length === 0) return;
    (async () => {
      try {
        const url = mode === 'self' ? '/api/self-phones' : '/api/gift-phones';
        const res = await fetch(getApiUrl(url), { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();

        setPhonesList(data);

        if (data.length) {
          const first = data[0];
          setSelectedPhone(mode === 'self' ? first.number : `${first.number}|${first.recipientName}`);
          setIsAddingNewPhone(false);
        } else {
          setSelectedPhone('');
          setIsAddingNewPhone(true);
        }
      } catch (err) {
        console.error('Phone fetch failed:', err);
      }
    })();
  }, [mode, token, cartItems]);

  // Fetch saved addresses once on component mount
  useEffect(() => {
    if (cartItems.length === 0) return;
    (async () => {
      try {
        const res = await fetch(getApiUrl('/api/addresses'), { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setAddresses(data);
        if (data.length) {
          setSelectedAddress(data[0].address);
          setIsAddingNewAddress(false);
        } else {
          setSelectedAddress('');
          setIsAddingNewAddress(true);
        }
      } catch (err) {
        console.error('Address fetch failed:', err);
      }
    })();
  }, [token, cartItems]);

  // Handle phone dropdown changes
  const onPhoneSelect = val => {
    if (val === '__new__') {
      setIsAddingNewPhone(true);
      setSelectedPhone('');
    } else {
      setIsAddingNewPhone(false);
      setSelectedPhone(val);
    }
    setNewPhone('');
  };

  // Handle address dropdown changes
  const onAddressSelect = val => {
    if (val === '__new__') {
      setIsAddingNewAddress(true);
      setSelectedAddress('');
    } else {
      setIsAddingNewAddress(false);
      setSelectedAddress(val);
    }
    setNewAddress('');
  };

  // Place the order
  const handlePlaceOrder = async () => {
    const phone = (isAddingNewPhone ? newPhone : selectedPhone ? selectedPhone.split('|')[0] : '').trim();
    const address = (isAddingNewAddress ? newAddress : selectedAddress).trim();

    if (!phone || !address) {
      return alert('Please select or enter both phone and address.');
    }
    if (mode === 'gift' && !recipientName.trim()) {
      return alert('Please enter recipient name.');
    }

    try {
      // If adding new phone, save it to the database (as unverified)
      if (isAddingNewPhone) {
        if (mode === 'self') {
          // Fetch existing self phones first
          const getRes = await fetch(getApiUrl('/api/self-phones'), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const existingPhones = await getRes.json();
          // Check if already exists
          if (!existingPhones.some(p => p.number === phone)) {
            const updatedPhones = [...existingPhones, { number: phone, verified: false }];
            await fetch(getApiUrl('/api/self-phones'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ phones: updatedPhones })
            });
          }
        } else {
          // Fetch existing gift phones first
          const getRes = await fetch(getApiUrl('/api/gift-phones'), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const existingGifts = await getRes.json();
          // Check if already exists
          if (!existingGifts.some(g => g.number === phone && g.recipientName === recipientName)) {
            const updatedGifts = [...existingGifts, { number: phone, recipientName, verified: false }];
            await fetch(getApiUrl('/api/gift-phones'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ gifts: updatedGifts })
            });
          }
        }
      }

      if (isAddingNewAddress && address !== '') {
        try {
          const saveAddressRes = await fetch(getApiUrl('/api/addresses'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ address })
          });
          const saveAddressData = await saveAddressRes.json();
          if (!saveAddressRes.ok) {
            throw new Error(saveAddressData.message || 'Failed to save new address.');
          }
          alert('New address saved successfully!');
        } catch (addressSaveError) {
          console.error('Error saving new address:', addressSaveError);
          return alert('Failed to save new address: ' + addressSaveError.message);
        }
      }

      const payload = {
        items: cartItems.map(item => ({
          product: item._id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price
        })),
        totalAmount,
        mode,
        phone,
        recipientName: mode === 'gift' ? recipientName : '',
        address
      };

      navigate('/payment', { state: { orderPayload: payload } });

    } catch (err) {
      alert('Checkout error: ' + err.message);
    }
  };

  return (
    <>
      <Header />
      <div className="checkout-wrapper">
        <div className="checkout-container">
          <h1>Checkout</h1>

          <div className="checkout-section">
            {/* Mode */}
            <div className="checkout-group">
              <label className="checkout-label">Order For</label>
              <select className="checkout-select" value={mode} onChange={e => setMode(e.target.value)}>
                <option value="self">Yourself</option>
                <option value="gift">Gift</option>
              </select>
            </div>

            {/* Recipient Name */}
            {mode === 'gift' && (
              <div className="checkout-group">
                <label className="checkout-label">Recipient Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter recipient name"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                />
              </div>
            )}

            {/* Phone Dropdown */}
            <div className="checkout-group">
              <label className="checkout-label">Select Phone Number</label>
              <select
                className="checkout-select"
                value={isAddingNewPhone ? '__new__' : selectedPhone}
                onChange={e => onPhoneSelect(e.target.value)}
              >
                <option value="">--Select--</option>
                {phonesList.map(p => {
                  const val = mode === 'self' ? p.number : `${p.number}|${p.recipientName}`;
                  const label = mode === 'self' 
                    ? `${p.number} (${p.verified ? 'Verified' : 'Unverified'})` 
                    : `${p.number} - ${p.recipientName} (${p.verified ? 'Verified' : 'Unverified'})`;
                  return (
                    <option key={val} value={val}>{label}</option>
                  );
                })}
                <option value="__new__">+ Add New Number</option>
              </select>
            </div>

            {/* New Phone */}
            {isAddingNewPhone && (
              <div className="checkout-group">
                <label className="checkout-label">New Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., +919876543210"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                />
                <span className="input-helper">This number will be saved to your profile for future use.</span>
              </div>
            )}

            {/* Address Dropdown */}
            <div className="checkout-group">
              <label className="checkout-label">Delivery Address</label>
              <select
                className="checkout-select"
                value={isAddingNewAddress ? '__new__' : selectedAddress}
                onChange={e => onAddressSelect(e.target.value)}
              >
                <option value="">--Select--</option>
                {addresses.map(a => (
                  <option key={a._id} value={a.address}>{a.address}</option>
                ))}
                <option value="__new__">+ Add New Address</option>
              </select>
            </div>

            {/* New Address Input */}
            {isAddingNewAddress && (
              <div className="checkout-group">
                <label className="checkout-label">New Delivery Address</label>
                <textarea
                  className="form-input checkout-textarea"
                  placeholder="Enter full shipping address details..."
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="checkout-summary-section">
            <div className="checkout-total-label">
              Total Amount: <strong>₹{totalAmount.toFixed(2)}</strong>
            </div>
            <button className="btn btn-primary pay-btn" onClick={handlePlaceOrder}>
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}