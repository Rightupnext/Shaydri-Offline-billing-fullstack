const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventoryController');
const { decryptMiddleware, wrapEncryptedHandler } = require('../middleware/encryption');

const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === 'true';

const withEncryption = (handler) =>
  isEncryptionEnabled ? [decryptMiddleware, wrapEncryptedHandler(handler)] : [handler];

// 🔄 Add Inventory Item
router.post(
  '/:dbName/add',
  ...withEncryption(inventoryController.addInventory)
);

// ✏️ Update Inventory Item
router.put(
  '/:dbName/:id',
  ...withEncryption(inventoryController.updateInventory)
);

// 📦 Get All Inventory
router.get(
  '/:dbName/list',
  ...withEncryption(inventoryController.getInventory)
);

// 📄 Get Inventory by ID
router.get(
  '/:dbName/:id',
  ...withEncryption(inventoryController.getInventoryById)
);

// ❌ Delete Inventory Item
router.delete(
  '/:dbName/delete/:inventoryId',
  ...withEncryption(inventoryController.deleteInventory)
);

module.exports = router;
