const SelfPhone = require('../models/SelfPhone');
const GiftPhone = require('../models/GiftPhone');
const OtpVerification = require('../models/OtpVerification');
const { sendSms } = require('../services/smsService');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// send OTP endpoint (for both self & gift)
exports.sendOtp = async (req, res) => {
  const userId = req.user.id;
  const { phone, mode, recipientName } = req.body;
  if (!phone || !mode) {
    return res.status(400).json({ message: 'phone and mode required' });
  }

  // if banned
  let existing = await OtpVerification.findOne({ user: userId, phone, mode });
  if (existing?.banned) {
    return res.status(429).json({ message: 'Too many attempts. Try later.' });
  }

  // generate new OTP and upsert
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpVerification.findOneAndUpdate(
    { user: userId, phone, mode },
    {
      otp, expiresAt,
      attemptsLeft: existing ? existing.attemptsLeft : 3,
      banned: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendSms(phone, `Your code is ${otp}`);
    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'SMS failed' });
  }
};

// verify OTP endpoint
exports.verifyOtp = async (req, res) => {
  const userId = req.user.id;
  const { phone, mode, otp, recipientName } = req.body;
  if (!phone || !mode || !otp) {
    return res.status(400).json({ message: 'phone, mode & otp required' });
  }

  const record = await OtpVerification.findOne({ user: userId, phone, mode });
  if (!record) {
    return res.status(400).json({ message: 'No OTP requested' });
  }
  if (record.banned) {
    return res.status(429).json({ message: 'Too many failed attempts' });
  }
  if (record.expiresAt < new Date()) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (record.otp !== otp) {
    // decrement attempts
    record.attemptsLeft -= 1;
    if (record.attemptsLeft <= 0) record.banned = true;
    await record.save();
    return res.status(400).json({
      message: record.banned
        ? 'Too many failed attempts; banned'
        : `Invalid OTP. ${record.attemptsLeft} tries left`
    });
  }

  // OTP correct: mark phone as verified in the appropriate collection
  if (mode === 'self') {
    const doc = await SelfPhone.findOne({ user: userId });
    if (doc) {
      const phoneIndex = doc.phones.findIndex(p => p.number === phone);
      if (phoneIndex > -1) {
        doc.phones[phoneIndex].verified = true;
      } else {
        doc.phones.push({ number: phone, verified: true });
      }
      await doc.save();
    } else {
      await SelfPhone.create({
        user: userId,
        phones: [{ number: phone, verified: true }]
      });
    }
  } else {
    // gift: need recipientName
    if (!recipientName) {
      return res.status(400).json({ message: 'recipientName required for gifts' });
    }
    const doc = await GiftPhone.findOne({ user: userId });
    if (doc) {
      const giftIndex = doc.gifts.findIndex(g => g.number === phone && g.recipientName === recipientName);
      if (giftIndex > -1) {
        doc.gifts[giftIndex].verified = true;
      } else {
        doc.gifts.push({ number: phone, recipientName, verified: true });
      }
      await doc.save();
    } else {
      await GiftPhone.create({
        user: userId,
        gifts: [{ number: phone, recipientName, verified: true }]
      });
    }
  }

  // clean up OTP record
  await record.deleteOne();
  res.json({ message: 'Phone verified' });
};
