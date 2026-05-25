import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import Header from '../components/Header';
import './Profile.css';

export default function Profile() {
  const { user, login } = useAuth();
  const [profileData, setProfileData] = useState({ username: '', email: '', phno: '', provider: '' });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', phno: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // Phone list management state
  const [selfPhones, setSelfPhones] = useState([]);
  const [giftPhones, setGiftPhones] = useState([]);
  const [newPhoneData, setNewPhoneData] = useState({ number: '', mode: 'self', recipientName: '' });
  const [phoneOtpState, setPhoneOtpState] = useState({
    active: false,
    phone: '',
    mode: '',
    recipientName: '',
    otp: '',
    sending: false,
    verifying: false
  });

  const fetchPhoneNumbers = useCallback(async () => {
    try {
      const selfRes = await fetch(getApiUrl('/api/self-phones'), {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (selfRes.ok) {
        const selfData = await selfRes.json();
        setSelfPhones(selfData);
      }
      
      const giftRes = await fetch(getApiUrl('/api/gift-phones'), {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (giftRes.ok) {
        const giftData = await giftRes.json();
        setGiftPhones(giftData);
      }
    } catch (err) {
      console.error('Failed to fetch profile phone numbers:', err);
    }
  }, [user?.token]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(getApiUrl('/api/users/profile'), {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile data');
        const data = await res.json();
        setProfileData({
          username: data.username || '',
          email: data.email || '',
          phno: data.phno || '',
          provider: data.provider || 'local'
        });
        setFormData({
          username: data.username || '',
          email: data.email || '',
          phno: data.phno || ''
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchProfile();
      fetchPhoneNumbers();
    }
  }, [user, fetchPhoneNumbers]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (changingPassword) return;

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return alert('New password and confirm password do not match!');
    }

    if (passwordData.newPassword.length < 6) {
      return alert('New password must be at least 6 characters long!');
    }

    setChangingPassword(true);
    try {
      const res = await fetch(getApiUrl('/api/users/profile/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');

      alert(data.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setChangePasswordMode(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveRequest = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const res = await fetch(getApiUrl('/api/users/profile/request-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request OTP');

      alert(data.message);
      setOtpSent(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyUpdate = async (e) => {
    e.preventDefault();
    if (verifying) return;

    setVerifying(true);
    try {
      const res = await fetch(getApiUrl('/api/users/profile/verify-update'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ otp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');

      alert(data.message);
      login(data.token, data.user);

      setProfileData({
        username: formData.username,
        email: formData.email,
        phno: formData.phno,
        provider: profileData.provider
      });
      setOtpSent(false);
      setOtp('');
      setEditMode(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Add saved phone handler
  const handleAddPhone = async (e) => {
    e.preventDefault();
    const { number, mode, recipientName } = newPhoneData;
    if (!number.trim()) return alert('Please enter a phone number.');
    if (mode === 'gift' && !recipientName.trim()) return alert('Please enter recipient name.');

    try {
      if (mode === 'self') {
        if (selfPhones.some(p => p.number === number)) {
          return alert('This phone number already exists.');
        }
        const updated = [...selfPhones, { number, verified: false }];
        const res = await fetch(getApiUrl('/api/self-phones'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify({ phones: updated })
        });
        if (!res.ok) throw new Error('Failed to add number');
        const data = await res.json();
        setSelfPhones(data);
      } else {
        if (giftPhones.some(g => g.number === number && g.recipientName === recipientName)) {
          return alert('This recipient contact already exists.');
        }
        const updated = [...giftPhones, { number, recipientName, verified: false }];
        const res = await fetch(getApiUrl('/api/gift-phones'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify({ gifts: updated })
        });
        if (!res.ok) throw new Error('Failed to add gift contact');
        const data = await res.json();
        setGiftPhones(data);
      }
      setNewPhoneData({ number: '', mode: 'self', recipientName: '' });
      alert('Phone number added to saved list! You can verify it below.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete saved phone handler
  const handleDeletePhone = async (phoneToDelete, mode, recipientName = '') => {
    if (!window.confirm(`Are you sure you want to delete ${phoneToDelete}?`)) return;
    try {
      if (mode === 'self') {
        const updated = selfPhones.filter(p => p.number !== phoneToDelete);
        const res = await fetch(getApiUrl('/api/self-phones'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify({ phones: updated })
        });
        if (!res.ok) throw new Error('Failed to delete number');
        const data = await res.json();
        setSelfPhones(data);
      } else {
        const updated = giftPhones.filter(g => !(g.number === phoneToDelete && g.recipientName === recipientName));
        const res = await fetch(getApiUrl('/api/gift-phones'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify({ gifts: updated })
        });
        if (!res.ok) throw new Error('Failed to delete gift contact');
        const data = await res.json();
        setGiftPhones(data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Trigger send OTP for contact phone
  const handleSendPhoneOtp = async (phone, mode, recipientName = '') => {
    setPhoneOtpState({
      active: true,
      phone,
      mode,
      recipientName,
      otp: '',
      sending: true,
      verifying: false
    });
    try {
      const res = await fetch(getApiUrl('/api/phone/send-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ phone, mode, recipientName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      alert(data.message || 'OTP sent successfully!');
      setPhoneOtpState(prev => ({ ...prev, sending: false }));
    } catch (err) {
      alert(err.message);
      setPhoneOtpState({ active: false, phone: '', mode: '', recipientName: '', otp: '', sending: false, verifying: false });
    }
  };

  // Verify OTP for contact phone
  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    const { phone, mode, recipientName, otp } = phoneOtpState;
    if (!otp.trim()) return alert('Please enter the OTP code.');

    setPhoneOtpState(prev => ({ ...prev, verifying: true }));
    try {
      const res = await fetch(getApiUrl('/api/phone/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ phone, mode, otp, recipientName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      alert('Phone number verified successfully!');
      setPhoneOtpState({ active: false, phone: '', mode: '', recipientName: '', otp: '', sending: false, verifying: false });
      fetchPhoneNumbers();
    } catch (err) {
      alert(err.message);
      setPhoneOtpState(prev => ({ ...prev, verifying: false }));
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="profile-container loading-state">
          <p>Loading your profile details...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="profile-page-wrapper">
        {/* Card 1: User Profile Info */}
        <div className="profile-card">
          <div className="profile-avatar">
            <span>{profileData.username.charAt(0).toUpperCase()}</span>
          </div>
          <h2>My Profile</h2>

          {!editMode ? (
            <div className="profile-info-grid">
              <div className="info-row">
                <span className="label">Name</span>
                <span className="value">{profileData.username}</span>
              </div>
              <div className="info-row">
                <span className="label">Email</span>
                <span className="value">{profileData.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone Number</span>
                <span className="value">{profileData.phno}</span>
              </div>
              <div className="info-row">
                <span className="label">Sign-In Method</span>
                <span className="value provider-badge">{profileData.provider === 'google' ? 'Google OAuth' : 'Local Email/OTP'}</span>
              </div>
              <button onClick={() => setEditMode(true)} className="edit-profile-btn">
                Edit Profile Details
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveRequest} className="profile-edit-form">
              <div className="input-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={profileData.provider === 'google'}
                  required
                  title={profileData.provider === 'google' ? 'Google account email cannot be changed' : ''}
                />
                {profileData.provider === 'google' && (
                  <span className="input-helper">Google account email is locked.</span>
                )}
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phno"
                  value={formData.phno}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={saving} className="save-btn">
                  {saving ? 'Requesting OTP...' : 'Save & Verify'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({ ...profileData });
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Card 2: Phone Contacts Manager */}
        <div className="profile-card">
          <h2>Saved Contact Numbers</h2>
          
          <div className="phones-list">
            <h3>Yourself</h3>
            {selfPhones.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No personal phone numbers saved.</p>
            ) : (
              selfPhones.map(p => (
                <div key={p.number} className="phone-item">
                  <div className="phone-item-info">
                    <span className="phone-item-number">{p.number}</span>
                    <span className="phone-item-meta">Added: {new Date(p.addedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="phone-item-actions">
                    <span className={`phone-badge ${p.verified ? 'verified' : 'unverified'}`}>
                      {p.verified ? 'Verified' : 'Unverified'}
                    </span>
                    {!p.verified && (
                      <button 
                        className="verify-mini-btn" 
                        onClick={() => handleSendPhoneOtp(p.number, 'self')}
                      >
                        Verify
                      </button>
                    )}
                    <button 
                      className="delete-mini-btn" 
                      onClick={() => handleDeletePhone(p.number, 'self')}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}

            <h3 style={{ marginTop: '1rem' }}>Gifts / Recipients</h3>
            {giftPhones.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recipient numbers saved.</p>
            ) : (
              giftPhones.map(g => (
                <div key={`${g.number}-${g.recipientName}`} className="phone-item">
                  <div className="phone-item-info">
                    <span className="phone-item-number">{g.number}</span>
                    <span className="phone-item-meta">Recipient: <strong>{g.recipientName}</strong></span>
                  </div>
                  <div className="phone-item-actions">
                    <span className={`phone-badge ${g.verified ? 'verified' : 'unverified'}`}>
                      {g.verified ? 'Verified' : 'Unverified'}
                    </span>
                    {!g.verified && (
                      <button 
                        className="verify-mini-btn" 
                        onClick={() => handleSendPhoneOtp(g.number, 'gift', g.recipientName)}
                      >
                        Verify
                      </button>
                    )}
                    <button 
                      className="delete-mini-btn" 
                      onClick={() => handleDeletePhone(g.number, 'gift', g.recipientName)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Phone Form */}
          <form onSubmit={handleAddPhone} className="add-phone-form">
            <h3>Add Contact Number</h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Phone (e.g., +919876543210)"
                className="form-input"
                value={newPhoneData.number}
                onChange={e => setNewPhoneData({ ...newPhoneData, number: e.target.value })}
                required
              />
              <select
                value={newPhoneData.mode}
                onChange={e => setNewPhoneData({ ...newPhoneData, mode: e.target.value })}
              >
                <option value="self">Yourself</option>
                <option value="gift">Gift / Recipient</option>
              </select>
            </div>
            {newPhoneData.mode === 'gift' && (
              <input
                type="text"
                placeholder="Recipient Name"
                className="form-input"
                style={{ marginBottom: '1rem' }}
                value={newPhoneData.recipientName}
                onChange={e => setNewPhoneData({ ...newPhoneData, recipientName: e.target.value })}
                required
              />
            )}
            <button type="submit" className="add-phone-btn">Add Phone Number</button>
          </form>

          {/* Phone verification mini-block */}
          {phoneOtpState.active && (
            <div className="phone-otp-block">
              <p>
                Enter the OTP sent to <strong>{phoneOtpState.phone}</strong> 
                {phoneOtpState.recipientName && ` for ${phoneOtpState.recipientName}`}:
              </p>
              <form onSubmit={handleVerifyPhoneOtp} className="phone-otp-input-group">
                <input
                  type="text"
                  placeholder="6-digit code"
                  value={phoneOtpState.otp}
                  onChange={e => setPhoneOtpState({ ...phoneOtpState, otp: e.target.value })}
                  required
                />
                <button type="submit" disabled={phoneOtpState.verifying}>
                  {phoneOtpState.verifying ? 'Verifying...' : 'Verify'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Card 3: Change Password */}
        <div className="profile-card password-card">
          <h2>Change Password</h2>
          {!changePasswordMode ? (
            <button onClick={() => setChangePasswordMode(true)} className="edit-profile-btn password-btn">
              Change Account Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChangeSubmit} className="profile-edit-form">
              <div className="input-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={changingPassword} className="save-btn">
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordMode(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Profile info general update OTP verification modal */}
      {otpSent && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>Verify Profile Update</h3>
            <p>We've sent an OTP verification code to <strong>{formData.email}</strong>. Enter it below to confirm your changes.</p>
            <form onSubmit={handleVerifyUpdate}>
              <input
                type="text"
                placeholder="6-digit OTP code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button type="submit" disabled={verifying} className="modal-confirm-btn">
                  {verifying ? 'Verifying...' : 'Verify & Update'}
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className="modal-cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
