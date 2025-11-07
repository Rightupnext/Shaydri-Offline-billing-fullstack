const getUserDbConnection = require('../../getUserDbConnection');

// ✅ Create Customer
exports.createCustomer = async (req, res) => {
  const dbName = req.params.dbName;
  const { name, address, phone, gst_number, email } = req.body;

  try {
    const db = await getUserDbConnection(dbName);

    const [result] = await db.query(
      'INSERT INTO customers (name, address, phone, gst_number, email) VALUES (?, ?, ?, ?, ?)',
      [name, address, phone, gst_number, email]
    );

    res.status(201).json({ message: 'Customer created', id: result.insertId });
  } catch (err) {
    console.error('❌ Create Customer Error:', err);
    res.status(500).json({ message: 'Failed to create customer' });
  }
};

// ✅ Get All Customers
exports.getAllCustomers = async (req, res) => {
  const dbName = req.params.dbName;

  try {
    const db = await getUserDbConnection(dbName);
    const [rows] = await db.query(
      'SELECT * FROM customers WHERE is_deleted = 0 ORDER BY id DESC'
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ Get Customers Error:', err);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
};

// ✅ Update Customer
exports.updateCustomer = async (req, res) => {
  const dbName = req.params.dbName;
  const customerId = req.params.customerId;
  const { name, address, phone, gst_number, email } = req.body;

  try {
    const db = await getUserDbConnection(dbName);

    const [result] = await db.query(
      'UPDATE customers SET name = ?, address = ?, phone = ?, gst_number = ?, email = ? WHERE id = ?',
      [name, address, phone, gst_number, email, customerId]
    );

    res.status(200).json({ message: 'Customer updated' });
  } catch (err) {
    console.error('❌ Update Customer Error:', err);
    res.status(500).json({ message: 'Failed to update customer' });
  }
};

// ✅ Delete Customer
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const dbName = req.params.dbName;

  try {
    const db = await getUserDbConnection(dbName);

    const [result] = await db.query(
      'UPDATE customers SET is_deleted = 1 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer soft-deleted successfully' });
  } catch (err) {
    console.error('Delete Customer Error:', err);
    res.status(500).json({ message: 'Failed to soft-delete customer' });
  }
};
exports.getNextInvoiceNumber = async (req, res) => {
  const dbName = req.params.dbName;

  try {
    const db = await getUserDbConnection(dbName);

    // Get current year
    const currentYear = new Date().getFullYear();

    // Fetch the last invoice number for the current year
    const [rows] = await db.query(
      `SELECT invoice_no FROM invoices 
       WHERE invoice_no LIKE ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [`INV-${currentYear}-%`]
    );

    let nextNumber = 1;

    if (rows.length > 0) {
      const lastInvoice = rows[0].invoice_no; // e.g., "INV-2025-009"
      const parts = lastInvoice.split('-');
      const lastSeq = parseInt(parts[2]);
      nextNumber = lastSeq + 1;
    }

    // Format next invoice number
    const paddedNumber = String(nextNumber).padStart(3, '0');
    const nextInvoiceNo = `INV-${currentYear}-${paddedNumber}`;

    res.status(200).json({ nextInvoiceNo });
  } catch (error) {
    console.error('❌ Error generating next invoice number:', error);
    res.status(500).json({ message: 'Failed to generate invoice number' });
  }
};
