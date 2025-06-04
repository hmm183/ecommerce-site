const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      size: String,
      color: String,
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  mode: { type: String, enum: ['self','gift'], required: true },
  phone: String,
  recipientName: String,
  address: String,

  // ← New status field
  status: {
    type: String,
    enum: ['Processing','Shipped','Delivered','Cancelled'],
    default: 'Processing'
  },

  orderedAt: { type: Date, default: Date.now }
}, {
  timestamps: true   // adds createdAt / updatedAt
});

module.exports = mongoose.model('Order', orderSchema);
