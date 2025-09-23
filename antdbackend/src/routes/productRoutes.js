const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const {
  decryptMiddleware,
  wrapEncryptedHandler,
} = require('../middleware/encryption');

// ✅ Check env flag
const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === 'true';

// ✅ Utility to conditionally wrap handlers
const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// ✅ Create a new product
router.post('/:dbName/create', ...withEncryption(productController.createProduct));

// ✅ Get all products
router.get('/:dbName/all', ...withEncryption(productController.getProducts));

// ✅ Get a product by ID
router.get('/:dbName/:productId', ...withEncryption(productController.getProductById));

// ✅ Update a product by ID
router.put('/:dbName/:productId', ...withEncryption(productController.updateProductById));

// ✅ Delete a product by ID
router.delete('/:dbName/:productId', ...withEncryption(productController.deleteProductById));

module.exports = router;
