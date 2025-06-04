// server/controllers/productController.js
const Product = require('../models/Product');

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product' });
  }
};

// POST /api/products
// server/controllers/productController.js
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
    const { name, description, price, image, sizes, colors, category } = req.body;
    const product = new Product({ name, description, price, image, sizes, colors, category });
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
