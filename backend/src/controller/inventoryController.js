const getUserDbConnection = require("../../getUserDbConnection");

// ✅ Add Inventory Item
exports.addInventory = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const { item_name, category, kilo, grams, unit } = req.body;

    if (!item_name || !unit) {
      return res
        .status(400)
        .json({ message: "Item name and unit are required." });
    }

    const allowedUnits = [
      "kg",
      "g",
      "liter",
      "ml",
      "quintal",
      "tonne",
      "milligram",
      "dozen",
      "piece",
    ];
    if (!allowedUnits.includes(unit)) {
      return res.status(400).json({
        message: `Invalid unit! Only ${allowedUnits.join(", ")} are supported.`,
      });
    }

    let totalQuantity;
    if (unit === "kg" || unit === "liter") {
      totalQuantity = (
        (parseFloat(kilo) || 0) +
        (parseFloat(grams) || 0) / 1000
      ).toFixed(3);
    } else if (unit === "g" || unit === "ml") {
      totalQuantity = (
        (parseFloat(kilo) || 0) * 1000 +
        (parseFloat(grams) || 0)
      ).toFixed(3);
    } else if (unit === "quintal" || unit === "tonne") {
      totalQuantity = (parseFloat(kilo) || 0).toFixed(3);
    } else {
      totalQuantity = (parseFloat(grams) || 0).toFixed(3);
    }

    const db = await getUserDbConnection(dbName);
    const query = `INSERT INTO inventory (item_name, category, stock_quantity, unit) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(query, [
      item_name,
      category,
      totalQuantity,
      unit,
    ]);

    res.status(201).json({
      message: "Item added successfully",
      inventoryId: result.insertId,
    });
  } catch (error) {
    console.error("❌ Error adding inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update Inventory
exports.updateInventory = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const { inventory_id, item_name, category, unit, kilo, grams, action } =
      req.body;

    if (!inventory_id) {
      return res.status(400).json({ message: "Inventory ID is required." });
    }

    const allowedUnits = [
      "kg",
      "g",
      "liter",
      "ml",
      "quintal",
      "tonne",
      "milligram",
      "dozen",
      "piece",
    ];
    if (unit && !allowedUnits.includes(unit)) {
      return res.status(400).json({
        message: `Invalid unit! Allowed units: ${allowedUnits.join(", ")}`,
      });
    }

    const db = await getUserDbConnection(dbName);
    const [items] = await db.query(`SELECT * FROM inventory WHERE id = ?`, [
      inventory_id,
    ]);
    if (!items.length)
      return res.status(404).json({ message: "Inventory item not found." });

    const inventory = items[0];
    const baseUnit = unit || inventory.unit;

    if (item_name || category || unit) {
      await db.query(
        `UPDATE inventory SET 
          item_name = COALESCE(?, item_name), 
          category = COALESCE(?, category), 
          unit = COALESCE(?, unit)
         WHERE id = ?`,
        [item_name, category, unit, inventory_id]
      );
    }

    if (!action) {
      return res
        .status(200)
        .json({ message: "Inventory details updated successfully." });
    }

    if (!["add", "reduce"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'add' or 'reduce'." });
    }

    let inputQuantity;
    if (["kg", "liter"].includes(baseUnit)) {
      inputQuantity = (parseFloat(kilo) || 0) + (parseFloat(grams) || 0) / 1000;
    } else if (["g", "ml"].includes(baseUnit)) {
      inputQuantity = (parseFloat(kilo) || 0) * 1000 + (parseFloat(grams) || 0);
    } else if (["quintal", "tonne"].includes(baseUnit)) {
      inputQuantity = parseFloat(kilo) || 0;
    } else {
      inputQuantity = parseFloat(grams) || 0;
    }

    inputQuantity = parseFloat(inputQuantity.toFixed(3));

    if (
      action === "reduce" &&
      parseFloat(inventory.stock_quantity) < inputQuantity
    ) {
      return res.status(400).json({ message: "Insufficient stock to reduce." });
    }

    await db.query(
      `INSERT INTO stock_transactions (inventory_id, transaction_type, quantity, unit)
       VALUES (?, ?, ?, ?)`,
      [inventory_id, action, inputQuantity, baseUnit]
    );

    res.status(200).json({ message: `Stock ${action}ed successfully.` });
  } catch (error) {
    console.error("❌ Error updating inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get All Inventory
exports.getInventory = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const db = await getUserDbConnection(dbName);

    const query = `SELECT id, item_name, category, stock_quantity, unit, updated_at FROM inventory`;
    const [rows] = await db.query(query);

    const formattedData = rows.map((item) => ({
      ...item,
      stock_display:
        item.stock_quantity >= 1000
          ? `${Math.floor(item.stock_quantity / 1000)} kg ${
              item.stock_quantity % 1000
            } g`
          : `${item.stock_quantity} g`,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Inventory
exports.deleteInventory = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const inventoryId = req.params.inventoryId;

    const db = await getUserDbConnection(dbName);
    const query = `DELETE FROM inventory WHERE id = ?`;

    await db.query(query, [inventoryId]);
    res.status(200).json({ message: "Inventory deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Inventory By ID
exports.getInventoryById = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const id = req.params.id;

    const db = await getUserDbConnection(dbName);

    const query = `
      SELECT id, item_name, category, stock_quantity, unit, updated_at 
      FROM inventory 
      WHERE id = ?
    `;
    const [rows] = await db.query(query, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const item = rows[0];
    const stockDisplay =
      item.stock_quantity >= 1000
        ? `${Math.floor(item.stock_quantity / 1000)} kg ${
            item.stock_quantity % 1000
          } g`
        : `${item.stock_quantity} g`;

    const formattedItem = {
      ...item,
      stock_display: stockDisplay,
    };

    res.status(200).json(formattedItem);
  } catch (error) {
    console.error("❌ Error fetching inventory by ID:", error);
    res.status(500).json({ error: error.message });
  }
};
