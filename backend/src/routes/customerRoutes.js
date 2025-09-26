const express = require('express');
const router = express.Router();
const customerController = require('../controller/customerController');
const { decryptMiddleware, wrapEncryptedHandler } = require('../middleware/encryption');

// 🔐 Check if encryption is enabled
const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === 'true';

// ✅ Utility to conditionally wrap route handlers
const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// ➕ Create a new customer
router.post('/:dbName/add', ...withEncryption(customerController.createCustomer));

// 📥 Get all customers
router.get('/:dbName/get', ...withEncryption(customerController.getAllCustomers));

// ✏️ Update customer by ID
router.put('/:dbName/:customerId', ...withEncryption(customerController.updateCustomer));

// 🗑️ Delete customer by ID
router.delete('/:dbName/:customerId', ...withEncryption(customerController.deleteCustomer));

module.exports = router;
