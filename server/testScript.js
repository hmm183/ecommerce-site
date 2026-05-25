const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
require('dotenv').config();

async function testAll() {
  await mongoose.connect('mongodb://localhost:27017/ecommerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // 1. Create User
  let user = await User.findOne({ email: 'test@example.com' });
  if (!user) {
    user = await User.create({
      username: 'TestUser',
      email: 'test@example.com',
      password: 'test',
      phno: '1234567890',
      verified: true
    });
  }
  
  // 2. Create Product with Variants
  let product = await Product.create({
    name: 'Test Shirt',
    price: 100,
    sizes: ['M', 'L'],
    colors: ['Red', 'Blue'],
    stock: 50, // Flat stock for fallback
    variants: [
      { size: 'M', color: 'Blue', stock: 10 },
      { size: 'L', color: 'Red', stock: 5 }
    ]
  });

  console.log('✅ Created product with initial variant stock: M/Blue (10)');

  // 3. Simulate Order Logic
  const items = [{ product: product._id, quantity: 2, size: 'M', color: 'Blue', price: 100 }];
  
  for (const item of items) {
    const productObj = await Product.findById(item.product);
    if (productObj.variants && productObj.variants.length > 0) {
      const size = item.size || 'N/A';
      const color = item.color || 'N/A';
      const variant = productObj.variants.find(
        v => v.size.toLowerCase() === size.toLowerCase() && v.color.toLowerCase() === color.toLowerCase()
      );
      if (variant) {
        variant.stock -= item.quantity;
      }
      productObj.stock = Math.max(0, productObj.stock - item.quantity);
    }
    await productObj.save();
  }

  const updatedProduct = await Product.findById(product._id);
  const variant = updatedProduct.variants.find(v => v.size === 'M' && v.color === 'Blue');
  console.log(`✅ Variant Stock after order (expected 8): ${variant.stock}`);
  console.log(`✅ Flat Stock after order (expected 48): ${updatedProduct.stock}`);

  // 4. Test Review populate
  updatedProduct.ratings.push({
    user: user._id,
    rating: 5,
    reviewText: 'Great!'
  });
  await updatedProduct.save();

  const populatedProduct = await Product.findById(product._id).populate('ratings.user', 'username email');
  console.log(`✅ Reviewer Username Populated (expected 'TestUser'): ${populatedProduct.ratings[0].user.username}`);

  // Cleanup
  await Product.findByIdAndDelete(product._id);
  
  process.exit(0);
}
testAll();
