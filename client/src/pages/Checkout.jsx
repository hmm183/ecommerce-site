import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useContext(CartContext);
  const token = localStorage.getItem('token');
  const totalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 1) Order mode
  const [mode, setMode] = useState('self');
  const [recipientName, setRecipientName] = useState('');

  // 2) Phones
  const [verifiedPhones, setVerifiedPhones] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [isAddingNewPhone, setIsAddingNewPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // 3) Addresses
  const [addresses, setAddresses] = useState([]); // State to hold fetched addresses
  const [selectedAddress, setSelectedAddress] = useState(''); // State for the currently selected address
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false); // Flag for adding a new address
  const [newAddress, setNewAddress] = useState(''); // State for the new address typed in

  // Fetch verified phones whenever mode changes
  useEffect(() => {
    (async () => {
      try {
        const url = mode === 'self' ? '/api/self-phones' : '/api/gift-phones';
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();

        // data is array of objects; extract number strings
        const list = mode === 'self'
          ? data.map(p => p.number)
          : data.map(g => `${g.number} - ${g.recipientName}`);

        setVerifiedPhones(list);

        if (list.length) {
          // auto-select the first verified number
          setSelectedPhone(list[0]);
          setIsAddingNewPhone(false);
        } else {
          // no verified numbers yet
          setSelectedPhone('');
          setIsAddingNewPhone(true);
        }
      } catch (err) {
        console.error('Phone fetch failed:', err);
      }
    })();
  }, [mode, token]);

  // Fetch saved addresses once on component mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json(); // This 'data' contains your fetched saved addresses
        setAddresses(data); // Update the state with fetched addresses
        if (data.length) {
          setSelectedAddress(data[0].address); // Auto-select the first fetched address
          setIsAddingNewAddress(false);
        } else {
          setSelectedAddress('');
          setIsAddingNewAddress(true); // If no addresses, default to adding a new one
        }
      } catch (err) {
        console.error('Address fetch failed:', err);
      }
    })();
  }, [token]);

  // Handle phone dropdown changes
  const onPhoneSelect = val => {
    if (val === '__new__') {
      setIsAddingNewPhone(true);
      setSelectedPhone('');
    } else {
      setIsAddingNewPhone(false);
      setSelectedPhone(val);
    }
    // reset OTP inputs
    setOtpSent(false);
    setOtp('');
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
    setNewAddress(''); // Clear new address input when selecting from dropdown
  };

  // Send OTP (only for newPhone)
  const sendOTP = async () => {
    if (!newPhone) return alert('Enter a phone number');
    try {
      const res = await fetch('/api/phone/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: newPhone, mode, recipientName })
      });
      const { message } = await res.json();
      if (!res.ok) throw new Error(message);
      alert(message);
      setOtpSent(true);
    } catch (err) {
      alert('Send OTP failed: ' + err.message);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    try {
      const res = await fetch('/api/phone/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: newPhone, otp, mode, recipientName })
      });
      const { message } = await res.json();
      if (!res.ok) throw new Error(message);
      alert('Phone verified!');
      // add to verified and select
      const entry = mode === 'self'
        ? newPhone
        : `${newPhone} - ${recipientName}`;
      setVerifiedPhones(prev => [...prev, entry]);
      setSelectedPhone(entry);
      // reset new flow
      setNewPhone('');
      setOtp('');
      setOtpSent(false);
      setIsAddingNewPhone(false);
    } catch (err) {
      alert('Verify OTP failed: ' + err.message);
    }
  };

  // Place the order
  const handlePlaceOrder = async () => {
    const phone = selectedPhone.split(' - ')[0]; // Extract just the phone number if it's from a gift contact
    const address = isAddingNewAddress ? newAddress : selectedAddress; // Determine the final address string

    // Basic validation
    if (!phone || !address) {
      return alert('Please select or enter both phone and address.');
    }
    if (mode === 'gift' && !recipientName) {
      return alert('Please enter recipient name.');
    }

    try {
      // --- NEW LOGIC: Save Address if it's a new one before proceeding ---
      // This ensures the new address is saved to the database.
      if (isAddingNewAddress && newAddress.trim() !== '') {
        try {
          const saveAddressRes = await fetch('/api/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ address: newAddress }) // Send the new address for saving
          });
          const saveAddressData = await saveAddressRes.json();
          if (!saveAddressRes.ok) {
            throw new Error(saveAddressData.message || 'Failed to save new address.');
          }
          // Optionally update local state with the newly saved address
          // setAddresses(prev => [...prev, saveAddressData]);
          alert('New address saved successfully!');
        } catch (addressSaveError) {
          console.error('Error saving new address:', addressSaveError);
          return alert('Failed to save new address: ' + addressSaveError.message);
        }
      }
      // --- END NEW LOGIC ---

      // Construct the order payload. This payload will be passed to the Payment page.
      // The order is NOT saved to the database yet.
      const payload = {
        items: cartItems.map(item => ({
          product: item._id, // Critical: Map the product's _id to 'product' field for the server
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price
        })),
        totalAmount,
        mode,
        phone,
        recipientName: mode === 'gift' ? recipientName : '',
        address // The final address string (either existing selected or newly saved)
      };

      // Navigate to the Payment page, passing the full order payload in the state
      navigate('/payment', { state: { orderPayload: payload } });

    } catch (err) {
      // Catch any errors that occur during initial validation or address saving
      alert('Checkout error: ' + err.message);
    }
  };

  return (
    <div className="checkout">
      <h1>Checkout</h1>

      {/* Mode */}
      <div>
        <label>Order for:</label>
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="self">Yourself</option>
          <option value="gift">Gift</option>
        </select>
      </div>

      {/* Recipient Name */}
      {mode === 'gift' && (
        <div>
          <label>Recipient Name:</label>
          <input
            type="text"
            value={recipientName}
            onChange={e => setRecipientName(e.target.value)}
          />
        </div>
      )}

      {/* Phone Dropdown */}
      <div>
        <label>Select Phone:</label>
        <select
          value={isAddingNewPhone ? '__new__' : selectedPhone}
          onChange={e => onPhoneSelect(e.target.value)}
        >
          <option value="">--Select--</option>
          {verifiedPhones.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value="__new__">+ Add New Number</option>
        </select>
      </div>

      {/* New Phone & OTP */}
      {isAddingNewPhone && (
        <div style={{ margin: 10 }}>
          <input
            type="text"
            placeholder="Enter new phone"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
          />
          <button onClick={sendOTP}>Send OTP</button>

          {otpSent && (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
              <button onClick={verifyOTP}>Verify OTP</button>
            </>
          )}
        </div>
      )}

      {/* Address Dropdown */}
      <div>
        <label>Select Address:</label>
        <select
          value={isAddingNewAddress ? '__new__' : selectedAddress}
          onChange={e => onAddressSelect(e.target.value)}
        >
          <option value="">--Select--</option>
          {/* Map through fetched addresses to create options */}
          {addresses.map(a => (
            <option key={a._id} value={a.address}>{a.address}</option>
          ))}
          <option value="__new__">+ Add New Address</option>
        </select>
      </div>

      {/* New Address Input */}
      {isAddingNewAddress && (
        <div style={{ margin: 10 }}>
          <textarea
            placeholder="Enter new address"
            value={newAddress}
            onChange={e => setNewAddress(e.target.value)}
            style={{ width: '100%', height: 60 }}
          />
        </div>
      )}

      {/* Summary & Pay Button */}
      <div style={{ marginTop: 20 }}>
        <h2>Total: ₹{totalAmount.toFixed(2)}</h2>
        <button className="btn" onClick={handlePlaceOrder}>
          Pay Now
        </button>
      </div>
    </div>
  );
}