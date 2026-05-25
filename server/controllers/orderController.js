// server/controllers/orderController.js
const Order    = require('../models/Order');
const CartItem = require('../models/CartItem');
const Product  = require('../models/Product');
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

    // 1) Validate stock for all items first
    for (const item of orderItems) {
      const productObj = await Product.findById(item.product);
      if (!productObj) {
        return res.status(404).json({ message: `Product not found during stock validation: ${item.product}` });
      }

      if (productObj.variants && productObj.variants.length > 0) {
        const size = item.size || 'N/A';
        const color = item.color || 'N/A';
        const variant = productObj.variants.find(
          v => v.size.toLowerCase() === size.toLowerCase() && v.color.toLowerCase() === color.toLowerCase()
        );
        if (!variant) {
          return res.status(400).json({ message: `Variant (Size: ${size}, Color: ${color}) not found for product ${productObj.name}` });
        }
        if (variant.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for product ${productObj.name} (Size: ${size}, Color: ${color}). Requested: ${item.quantity}, Available: ${variant.stock}` });
        }
      } else {
        if (productObj.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for product ${productObj.name}. Requested: ${item.quantity}, Available: ${productObj.stock}` });
        }
      }
    }

    // 2) Decrement and save stock for all items
    for (const item of orderItems) {
      const productObj = await Product.findById(item.product);
      if (productObj.variants && productObj.variants.length > 0) {
        const size = item.size || 'N/A';
        const color = item.color || 'N/A';
        const variant = productObj.variants.find(
          v => v.size.toLowerCase() === size.toLowerCase() && v.color.toLowerCase() === color.toLowerCase()
        );
        variant.stock -= item.quantity;
        productObj.stock = Math.max(0, productObj.stock - item.quantity);
      } else {
        productObj.stock -= item.quantity;
      }
      await productObj.save();
    }

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

    // populate product details for email formatting
    const populatedOrder = await Order.findById(order._id).populate('items.product');
    const { sendOrderConfirmationEmail } = require('../services/emailService');
    try {
      if (req.user && req.user.email) {
        await sendOrderConfirmationEmail(req.user.email, populatedOrder);
        console.log('✅ Order confirmation email sent to:', req.user.email);
      }
    } catch (emailErr) {
      console.error('❌ Failed to send order confirmation email:', emailErr);
    }

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
                               .populate('items.product', 'name price image'); // Populate product name, price, image for display

    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
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
      .populate('items.product', 'name price image')
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