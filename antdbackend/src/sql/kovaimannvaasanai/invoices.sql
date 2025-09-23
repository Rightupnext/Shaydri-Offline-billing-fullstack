CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_no VARCHAR(50) NOT NULL UNIQUE,        -- Invoice number (e.g., INV-2025-004)
  customer JSON NOT NULL,                        -- Customer details (name, phone, email, etc.)
  items JSON NOT NULL,                           -- List of billed items
  charges JSON DEFAULT NULL,                     -- Charges: delivery, box, discount
  computedtotals JSON DEFAULT NULL,              -- Totals: subtotal, tax, finalAmount, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Auto-filled on insert
);
