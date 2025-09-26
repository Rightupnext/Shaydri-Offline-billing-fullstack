const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');
const { decryptMiddleware, wrapEncryptedHandler } = require('../middleware/encryption');

// 🔐 Flag from environment
const isEncryptionEnabled = process.env.ENCRYPTION_ENABLED === 'true';

// 📦 Utility to apply encryption/decryption
const withEncryption = (handler) =>
  isEncryptionEnabled
    ? [decryptMiddleware, wrapEncryptedHandler(handler)]
    : [handler];

// ➕ Create invoice
router.post('/:dbName/add', ...withEncryption(invoiceController.createInvoice));

// 📥 Get all invoices
router.get('/:dbName/get', ...withEncryption(invoiceController.getAllInvoices));

// 🔍 Get invoice by ID
router.get('/:dbName/:id', ...withEncryption(invoiceController.getInvoiceById));

// ✏️ Update invoice
router.put('/:dbName/:id', ...withEncryption(invoiceController.updateInvoiceById));

// 🗑️ Delete invoice
router.delete('/:dbName/:id', ...withEncryption(invoiceController.deleteInvoiceById));

// 🔢 Get next invoice number — no encryption needed
router.get('/:dbName/next/invoice-number', invoiceController.getNextInvoiceNumber);

// 💳 Record payment
router.post('/:dbName/payment/:id', ...withEncryption(invoiceController.addPaymentToInvoice));

// 📊 Invoice analytics
router.get('/:dbName', ...withEncryption(invoiceController.getInvoiceAnalytics));

module.exports = router;
