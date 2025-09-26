const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const {
  decryptMiddleware,
  wrapEncryptedHandler,
} = require("../middleware/encryption");

// 🔐 Flag to enable/disable encryption dynamically
const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === "true";

// 🔧 Helper for conditional middleware
const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// 👤 Register — usually unencrypted (unless you want to secure it too)
router.post("/register", ...withEncryption(authController.register));

// 🔐 Login — wrapped with encryption if enabled
router.post("/login", ...withEncryption(authController.login));

module.exports = router;
