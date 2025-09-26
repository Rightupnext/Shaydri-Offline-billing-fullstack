const express = require("express");
const router = express.Router();
const subscriptionRazerpayTenantController = require("../controller/subscriptionRazerpayTenantController");
const checkSubscriptionExpiry = require("../middleware/checkSubscriptionExpiry");
const { decryptMiddleware, wrapEncryptedHandler } = require('../middleware/encryption');

const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === 'true';


// Utility: Apply conditional encryption
const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// 🛡️ Global middleware for all subscription routes
router.use("/:dbName", checkSubscriptionExpiry);

// 🔐 Apply encryption wrapper if enabled
router.post(
  "/:dbName/create-subscription",
  ...withEncryption(subscriptionRazerpayTenantController.createOrder)
);

router.post(
  "/:dbName/verify-payment",
  ...withEncryption(subscriptionRazerpayTenantController.verifyPayment)
);

router.get(
  "/:dbName/monitor-subscription",
  ...withEncryption(subscriptionRazerpayTenantController.monitorSubscription)
);

module.exports = router;
