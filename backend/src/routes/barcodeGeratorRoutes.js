const express = require("express");
const router = express.Router();
const barcodeController = require("../controller/barcodeController");
const checkSubscriptionExpiry = require("../middleware/checkSubscriptionExpiry");
const { decryptMiddleware, wrapEncryptedHandler } = require('../middleware/encryption');

const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === 'true';


// Utility to wrap encryption
const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// Apply subscription middleware to all /:dbName routes
router.use("/:dbName", checkSubscriptionExpiry);

// Routes
router.get(
  "/:dbName/create-barcode/:productId",
  ...withEncryption(barcodeController.generateBarcode)
);

router.get(
  "/:dbName/image-barcode/:productId",
  ...withEncryption(barcodeController.getProductBarcodeImage)
);

router.post(
  "/:dbName/post-scan-product/:deviceId",
 barcodeController.scanProductByBarcode
);

router.post(
  "/:dbName/reset-scanned-product",
  ...withEncryption(barcodeController.resetScannedProduct)
);

router.put(
  "/:dbName/update-barcodes",
  ...withEncryption(barcodeController.updateAllBarcodeIds)
);

module.exports = router;
