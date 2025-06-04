const Address = require('../models/SavedAddress');

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
};

exports.saveAddress = async (req, res) => {
  const { address, label } = req.body;
  if (!address) return res.status(400).json({ message: 'Address is required' });

  try {
    const newAddress = await Address.create({
      user: req.user.id,
      address,
      label
    });
    res.status(201).json(newAddress);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save address' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete address' });
  }
};
