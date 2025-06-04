// server/controllers/orderController.js
const Order    = require('../models/Order');
const CartItem = require('../models/CartItem');
const mongoose = require('mongoose'); // Ensure mongoose is imported for ObjectId.isValid

/**
 * Create a new order.
 * Expects in req.body:
 * - items: Array of { product, quantity, size, color, price } (where product is the product _id string)
 * - totalAmount: Number
 * - mode: 'self' or 'gift'
 * - phone: String
 * - recipientName: String (if mode==='gift')
 * - address: String
 */
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { items, totalAmount, mode, phone, recipientName, address } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Cart items required' });
  }
  if (typeof totalAmount !== 'number') {
    return res.status(400).json({ message: 'Total amount is required' });
  }

  try {
    const orderItems = items.map(i => {
      // **THIS IS THE CRUCIAL PART: The server expects 'product' on the incoming object**
      // **AND we validate it to ensure it's a valid ObjectId string.**
      if (!i.product) {
        throw new Error('Product ID (product) is missing for one or more items in the cart.');
      }
      if (!mongoose.Types.ObjectId.isValid(i.product)) {
        throw new Error(`Invalid Product ID format for item: ${i.product}`);
      }

      return {
        product: i.product, // Server takes the 'product' field from the incoming item
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        price: i.price
      };
    });

    const order = await Order.create({
      user: userId,
      items: orderItems, // Use the validated and mapped orderItems
      totalAmount,
      mode,
      phone,
      recipientName: mode === 'gift' ? recipientName : undefined,
      address
      // status will default to 'Processing'
      // orderedAt and timestamps are automatic
    });

    // clear server-side cart for this user
    await CartItem.deleteMany({ user: userId });

    return res.status(201).json({
      message: 'Order created successfully',
      orderId: order._id
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ message: 'Failed to create order: ' + err.message }); // Add error message for more detail
  }
};

/**
 * Get all orders (admin only).
 */
exports.getOrders = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const orders = await Order.find()
      .populate('user', 'email username')
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error('getOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};



// NEW: Get all orders for the logged-in user
exports.getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from the authenticated request

    // Find all orders associated with this user, sort by latest first
    // Populate 'items.product' if you need product details like image, category etc.
    // For just basic status, you might not need to populate product details if 'items' already has name/price.
    const orders = await Order.find({ user: userId })
                               .sort({ createdAt: -1 }) // Sort by newest orders first
                               .populate('items.product', 'name price imageUrl'); // Populate product name, price, imageUrl for display

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user.' });
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders.' });
  }
};
/**
 * Update the status of an order (admin only).
 * Expects in req.body: { status: 'Processing'|'Shipped'|'Delivered'|'Cancelled' }
 */
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['Processing','Shipped','Delivered','Cancelled'];

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.json({ message: 'Status updated', order });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
};


exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  const viewerId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  // 1) Validate ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  try {
    // 2) Find order, populate products so frontend can show names/prices if desired
    const order = await Order.findById(id)
      .populate('items.product', 'name price imageUrl')
      .populate('user', 'email username');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 3) Authorization: only owner or admin can view
    if (!isAdmin && order.user._id.toString() !== viewerId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 4) Return it
    res.json(order);
  } catch (err) {
    console.error('getOrderById error:', err);
    res.status(500).json({ message: 'Server error fetching order' });
  }
};