const express = require('express');
const router = express.Router();
const categoryController = require('../controller/categoryController');
const {
  decryptMiddleware,
  wrapEncryptedHandler,
} = require('../middleware/encryption');

// Check if encryption is enabled via .env
const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === 'true';

// Helper to wrap handlers conditionally
const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// 📦 Create Category
router.post('/:dbName/', ...withEncryption(categoryController.createCategory));

// 📋 Get All Categories
router.get('/:dbName', ...withEncryption(categoryController.getAllCategories));

// ✏️ Update Category
router.put('/:dbName/:id', ...withEncryption(categoryController.updateCategoryById));

// ❌ Delete Category
router.delete('/:dbName/:id', ...withEncryption(categoryController.deleteCategoryById));

module.exports = router;
