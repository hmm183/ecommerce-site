const CartItem = require('../models/CartItem');

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await CartItem.find({ user: userId }).populate('product');
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

// POST /api/cart
exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = req.body;

    // Clear existing cart
    await CartItem.deleteMany({ user: userId });

    // Save new items
    const cartDocs = items.map(item => ({
      user: userId,
      product: item._id,
      quantity: item.quantity,
      size: item.size,
      color: item.color
    }));

    await CartItem.insertMany(cartDocs);

    res.status(200).json({ message: 'Cart updated' });
  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({ message: 'Failed to update cart' });
  }
};
