// server/controllers/productController.js
const Product = require('../models/Product');

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('ratings.user', 'username email');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('ratings.user', 'username email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

// Helper guard
function ensureAdmin(req, res) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: admins only' });
    return false;
  }
  return true;
}

// POST /api/products
exports.createProduct = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// POST /api/products/:id/rate
exports.rateProduct = async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!product.ratings) product.ratings = [];

    const existingRatingIndex = product.ratings.findIndex(
      r => r.user.toString() === userId.toString()
    );

    if (existingRatingIndex > -1) {
      product.ratings[existingRatingIndex].rating = Number(rating);
      if (reviewText !== undefined) {
        product.ratings[existingRatingIndex].reviewText = reviewText;
      }
    } else {
      product.ratings.push({
        user: userId,
        rating: Number(rating),
        reviewText: reviewText || ''
      });
    }

    // Recalculate average rating and reviewCount
    const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    product.rating = parseFloat((totalRating / product.ratings.length).toFixed(1));
    product.reviewCount = product.ratings.length;

    await product.save();
    await product.populate('ratings.user', 'username email');
    res.json(product);
  } catch (err) {
    console.error('Error rating product:', err);
    res.status(500).json({ message: 'Server error rating product' });
  }
};
