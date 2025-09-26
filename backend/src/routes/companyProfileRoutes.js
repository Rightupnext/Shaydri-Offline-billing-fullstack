// routes/companyProfileRoutes.js
const express = require("express");
const router = express.Router();
const companyProfileController = require("../controller/companyProfileController");
const { upload, processImage } = require("../middleware/upload");
const {
  decryptMiddleware,
  wrapEncryptedHandler,
} = require("../middleware/encryption");
const checkSubscriptionExpiry = require("../middleware/checkSubscriptionExpiry");
const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === "true";

const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

router.post(
  "/:dbName/add",
  upload.single("logo"),
  processImage,
  // checkSubscriptionExpiry,
  ...withEncryption(companyProfileController.upsertCompanyProfile)
);

router.get(
  "/:dbName/get",
  // checkSubscriptionExpiry,
  ...withEncryption(companyProfileController.getCompanyProfile)
);

module.exports = router;
