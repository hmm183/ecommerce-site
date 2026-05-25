const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  sizes: [String],
  colors: [String],
  category: String,
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 50
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  ratings: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, required: true },
      reviewText: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  variants: [
    {
      size: { type: String, default: 'N/A' },
      color: { type: String, default: 'N/A' },
      stock: { type: Number, default: 0 }
    }
  ]
});

module.exports = mongoose.model('Product', productSchema);
