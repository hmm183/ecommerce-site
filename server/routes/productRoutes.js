const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  rateProduct,
} = require('../controllers/productController');
const authenticateJWT = require('../middleware/jwtAuth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', authenticateJWT, createProduct);
router.put('/:id', authenticateJWT, updateProduct);
router.delete('/:id', authenticateJWT, deleteProduct);
router.post('/:id/rate', authenticateJWT, rateProduct);

// Signed product image upload endpoint to Cloudinary
router.post('/upload', authenticateJWT, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admins only' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'ecommerce/products' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Cloudinary upload failed' });
        }
        res.status(200).json({ imageUrl: result.secure_url });
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({ message: 'Server upload handler failed' });
  }
});

module.exports = router;
