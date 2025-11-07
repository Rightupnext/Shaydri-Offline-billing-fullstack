const getUserDbConnection = require('../../getUserDbConnection');

// ✅ Create Product
exports.createProduct = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const {
      product_name, category_id, inventory_item_id,
      kilo, grams, mfg_date, mrp, saleMrp, exp_date, unit
    } = req.body;

    if (!product_name || !category_id || !inventory_item_id || !unit || mrp == null || saleMrp == null) {
      return res.status(400).json({ message: "All required fields must be filled, including inventory_item_id." });
    }

    const kiloValue = kilo === "" || kilo == null ? 0 : parseInt(kilo, 10);
    const gramsValue = grams === "" || grams == null ? 0 : Math.min(parseInt(grams, 10), 999);
    const mfgDateValue = mfg_date === "" || mfg_date == null ? null : mfg_date;
    const expDateValue = exp_date === "" || exp_date == null ? null : exp_date;

    const db = await getUserDbConnection(dbName);

    const query = `
      INSERT INTO products 
        (product_name, category_id, inventory_item_id, kilo, grams, mrp, saleMrp, exp_date, mfg_date, unit) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      product_name, category_id, inventory_item_id,
      kiloValue, gramsValue, mrp, saleMrp, expDateValue, mfgDateValue, unit
    ]);

    res.status(201).json({ message: "Product created successfully", productId: result.insertId });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Products (ignore soft-deleted)
exports.getProducts = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const db = await getUserDbConnection(dbName);

    const query = `
      SELECT 
        p.id,
        COALESCE(i.item_name, p.product_name) AS product_name,
        COALESCE(i.category_id, p.category_id) AS category_id,
        p.inventory_item_id,
        p.kilo,
        p.grams,
        p.exp_date,
        p.mfg_date,
        p.mrp,
        p.saleMrp,
        p.barcode_id,
        p.barcode_path,
        p.barcode_status,
        p.unit,
        i.stock_quantity AS inventory_quantity,
        COALESCE(ci.category_name, c.category_name) AS category_name,
        COALESCE(ci.CGST, c.CGST) AS CGST,
        COALESCE(ci.SGST, c.SGST) AS SGST
      FROM products p
      LEFT JOIN inventory i ON p.inventory_item_id = i.id AND i.is_deleted = 0
      LEFT JOIN categories c ON p.category_id = c.id AND c.is_deleted = 0
      LEFT JOIN categories ci ON i.category_id = ci.id AND ci.is_deleted = 0
      WHERE p.is_deleted = 0
      ORDER BY p.id DESC
    `;

    const [products] = await db.query(query);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ error: error.message });
  }
};




// ✅ Get Product By ID (auto replace product_name from inventory)
exports.getProductById = async (req, res) => {
  try {
    const { dbName, productId } = req.params;
    const db = await getUserDbConnection(dbName);

    const query = `
      SELECT 
        p.id,
        COALESCE(i.item_name, p.product_name) AS product_name,
        p.category_id,
        p.inventory_item_id,
        p.kilo,
        p.grams,
        p.exp_date,
        p.mfg_date,
        p.mrp,
        p.saleMrp,
        p.barcode_id,
        p.barcode_path,
        p.barcode_status,
        p.unit,
        c.category_name,
        c.SGST,
        c.CGST
      FROM products p
      LEFT JOIN inventory i ON p.inventory_item_id = i.id
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

// ✅ Get Product by Inventory Item ID
exports.getProductByInventoryId = async (req, res) => {
  try {
    const { dbName, inventoryItemId } = req.params;
    const db = await getUserDbConnection(dbName);

    const query = `
      SELECT 
        p.id,
        COALESCE(i.item_name, p.product_name) AS product_name,
        p.category_id,
        p.inventory_item_id,
        p.mrp,
        p.saleMrp,
        p.unit,
        c.category_name,
        c.SGST,
        c.CGST
      FROM products p
      LEFT JOIN inventory i ON p.inventory_item_id = i.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.inventory_item_id = ?
    `;

    const [rows] = await db.query(query, [inventoryItemId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found for given inventory_item_id" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("❌ Error fetching product by inventory_item_id:", error);
    res.status(500).json({ error: error.message });
  }
};


// ✅ Update Product By ID
exports.updateProductById = async (req, res) => {
  try {
    const { dbName, productId } = req.params;
    let {
      product_name, category_id, inventory_item_id,
      kilo, grams, mfg_date, mrp, saleMrp, exp_date, unit
    } = req.body;

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

    const addField = (field, value) => {
      if (value !== undefined) {
        updateFields.push(field);
        updateValues.push(value);
      }
    };

    addField("product_name", product_name);
    addField("category_id", category_id);
    addField("inventory_item_id", inventory_item_id);
    addField("kilo", Number(kilo) || 0);
    addField("grams", Number(grams) || 0);
    addField("mrp", parseFloat(mrp) || 0.0);
    addField("saleMrp", parseFloat(saleMrp) || 0.0);
    addField("mfg_date", mfg_date === "N/A" ? null : mfg_date);
    addField("exp_date", exp_date === "N/A" ? null : exp_date);
    addField("unit", unit);

    if (existingProduct.barcode_status === 'barcode updated') {
      addField("barcode_status", "barcode not updated");
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updateQuery = `
      UPDATE products SET ${updateFields.map(f => `${f} = ?`).join(', ')} WHERE id = ?
    `;
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

    const [result] = await db.query(
      "UPDATE products SET is_deleted = 1 WHERE id = ?",
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product soft-deleted successfully" });
  } catch (error) {
    console.error("❌ Error soft-deleting product:", error);
    res.status(500).json({ error: error.message });
  }
};
