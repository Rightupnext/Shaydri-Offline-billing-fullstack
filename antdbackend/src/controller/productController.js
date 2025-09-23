const getUserDbConnection = require('../../getUserDbConnection');

// ✅ Create Product
exports.createProduct = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const {
      product_name, category_id, kilo, grams,
      mfg_date, mrp, saleMrp, exp_date, unit
    } = req.body;

    if (!product_name || !category_id || !unit || mrp == null || saleMrp == null) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const kiloValue = kilo === "" || kilo == null ? 0 : parseInt(kilo, 10);
    const gramsValue = grams === "" || grams == null ? 0 : Math.min(parseInt(grams, 10), 999);
    const mfgDateValue = mfg_date === "" || mfg_date == null ? null : mfg_date;
    const expDateValue = exp_date === "" || exp_date == null ? null : exp_date;

    const db = await getUserDbConnection(dbName);

    const query = `
      INSERT INTO products 
        (product_name, category_id, kilo, grams, mrp, saleMrp, exp_date, mfg_date, unit) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      product_name, category_id, kiloValue, gramsValue,
      mrp, saleMrp, expDateValue, mfgDateValue, unit
    ]);

    res.status(201).json({ message: "Product created successfully", productId: result.insertId });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Products
exports.getProducts = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const db = await getUserDbConnection(dbName);

    const query = `
      SELECT p.*, c.category_name, c.SGST, c.CGST 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    const [products] = await db.query(query);
    res.status(200).json({ products });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Product By ID
exports.getProductById = async (req, res) => {
  try {
    const { dbName, productId } = req.params;
    const db = await getUserDbConnection(dbName);

    const query = `
      SELECT p.*, c.category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `;

    const [products] = await db.query(query, [productId]);

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(products[0]);
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Product By ID
exports.updateProductById = async (req, res) => {
  try {
    const { dbName, productId } = req.params;
    let {
      product_name, category_id, kilo, grams,
      mfg_date, mrp, saleMrp, exp_date, unit
    } = req.body;
// console.log("product_name",product_name)
    const db = await getUserDbConnection(dbName);

    const [existingProductRows] = await db.query("SELECT * FROM products WHERE id = ?", [productId]);
    if (existingProductRows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingProduct = existingProductRows[0];
    const oldUnit = existingProduct.unit;

    if (unit !== oldUnit) {
      if (!['kg', 'liter', 'quintal', 'tonne'].includes(unit)) kilo = null;
      if (!['g', 'ml', 'kg', 'liter'].includes(unit)) grams = null;
    }

    const updateFields = [];
    const updateValues = [];

    if (kilo !== undefined) {
      kilo = Number(kilo) || 0;
      updateFields.push('kilo');
      updateValues.push(kilo);
    }
    if (grams !== undefined) {
      grams = Number(grams) || 0;
      updateFields.push('grams');
      updateValues.push(grams);
    }
    if (mrp !== undefined) {
      mrp = parseFloat(mrp) || 0.00;
      updateFields.push('mrp');
      updateValues.push(mrp);
    }
    if (saleMrp !== undefined) {
      saleMrp = parseFloat(saleMrp) || 0.00;
      updateFields.push('saleMrp');
      updateValues.push(saleMrp);
    }
    if (product_name !== undefined) {
      updateFields.push('product_name');
      updateValues.push(product_name);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id');
      updateValues.push(category_id);
    }
    if (mfg_date !== undefined) {
      updateFields.push('mfg_date');
      updateValues.push(mfg_date === 'N/A' ? null : mfg_date);
    }
    if (exp_date !== undefined) {
      updateFields.push('exp_date');
      updateValues.push(exp_date === 'N/A' ? null : exp_date);
    }
    if (unit !== undefined) {
      const allowedUnits = ['tonne', 'quintal', 'kg', 'g', 'gram', 'liter', 'ml', 'dozen', 'piece'];
      if (!allowedUnits.includes(unit)) {
        return res.status(400).json({ message: "Invalid unit" });
      }
      updateFields.push('unit');
      updateValues.push(unit);
    }

    if (existingProduct.barcode_status === 'barcode updated') {
      updateFields.push('barcode_status');
      updateValues.push('barcode not updated');
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    let updateQuery = "UPDATE products SET ";
    updateQuery += updateFields.map(field => `${field} = ?`).join(', ') + ' WHERE id = ?';
    updateValues.push(productId);

    await db.query(updateQuery, updateValues);
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("❌ Error updating product:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Product By ID
exports.deleteProductById = async (req, res) => {
  try {
    const { dbName, productId } = req.params;
    const db = await getUserDbConnection(dbName);

    const [result] = await db.query("DELETE FROM products WHERE id = ?", [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ error: error.message });
  }
};
