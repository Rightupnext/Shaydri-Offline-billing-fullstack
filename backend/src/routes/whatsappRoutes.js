const express = require("express");
const router = express.Router();
const whatsappController = require("../controller/WhatsappPdfSendController");
const {
  decryptMiddleware,
  wrapEncryptedHandler,
} = require("../middleware/encryption");

const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === "true";

const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// ✅ Upload and Save WhatsApp PDF Message
router.post(
  "/:dbName/upload",
  whatsappController.upload, // multer middleware first
  ...withEncryption(whatsappController.saveMessageAndSendPDF)
);

module.exports = router;
