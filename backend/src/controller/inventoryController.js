const getUserDbConnection = require("../../getUserDbConnection");

// ✅ Add Inventory Item
exports.addInventory = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const { item_name, category_id, kilo, grams, unit } = req.body;

    if (!item_name || !unit) {
      return res.status(400).json({ message: "Item name and unit are required." });
    }

    const allowedUnits = [
      "kg", "g", "liter", "ml", "quintal", "tonne", "milligram", "dozen", "piece"
    ];
    if (!allowedUnits.includes(unit)) {
      return res.status(400).json({
        message: `Invalid unit! Only ${allowedUnits.join(", ")} are supported.`
      });
    }

    let totalQuantity;
    if (unit === "kg" || unit === "liter") {
      totalQuantity = ((parseFloat(kilo) || 0) + (parseFloat(grams) || 0) / 1000).toFixed(3);
    } else if (unit === "g" || unit === "ml") {
      totalQuantity = ((parseFloat(kilo) || 0) * 1000 + (parseFloat(grams) || 0)).toFixed(3);
    } else if (unit === "quintal" || unit === "tonne") {
      totalQuantity = (parseFloat(kilo) || 0).toFixed(3);
    } else {
      totalQuantity = (parseFloat(grams) || 0).toFixed(3);
    }

    const db = await getUserDbConnection(dbName);
    const query = `INSERT INTO inventory (item_name, category_id, stock_quantity, unit) VALUES (?, ?, ?, ?)`;
    const [result] = await db.query(query, [item_name, category_id, totalQuantity, unit]);

    res.status(201).json({
      message: "Item added successfully",
      inventoryId: result.insertId
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
    const {
      inventory_id,
      item_name,
      category_id,
      unit,
      kilo,
      grams,
      action,
    } = req.body;

    if (!inventory_id) {
      return res.status(400).json({ message: "Inventory ID is required." });
    }

    const allowedUnits = [
      "kg", "g", "liter", "ml", "quintal", "tonne", "milligram", "dozen", "piece"
    ];
    if (unit && !allowedUnits.includes(unit)) {
      return res.status(400).json({ message: `Invalid unit! Allowed: ${allowedUnits.join(", ")}` });
    }

    const db = await getUserDbConnection(dbName);
    const [items] = await db.query(`SELECT * FROM inventory WHERE id = ?`, [inventory_id]);
    if (!items.length) return res.status(404).json({ message: "Inventory item not found." });

    const inventory = items[0];
    const baseUnit = unit || inventory.unit;

    // ✅ CASE 1: Edit item name or category (without stock change)
    if (!action) {
      await db.query(
        `UPDATE inventory 
         SET item_name = COALESCE(?, item_name),
             category_id = COALESCE(?, category_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [item_name, category_id, inventory_id]
      );

      return res.status(200).json({ message: "Inventory details updated successfully." });
    }

    // ✅ CASE 2: Stock adjustment (Add or Reduce)
    if (!["add", "reduce"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'add' or 'reduce'." });
    }

    let inputQuantity = 0;
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

    if (action === "reduce" && parseFloat(inventory.stock_quantity) < inputQuantity) {
      return res.status(400).json({ message: "Insufficient stock to reduce." });
    }

    // ✅ Insert transaction (trigger auto-updates stock)
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



// ✅ Get Inventory with Category + MRP + Profit Analytics + Date Filter
exports.getInventory = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const { start_date, end_date, show_all } = req.query; // ⏱️ Date range filter + show_all toggle
    const db = await getUserDbConnection(dbName);

    // ✅ Default: current month range if not provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    const startDate = start_date || defaultStart;
    const endDate = end_date || defaultEnd;

    // 1️⃣ Fetch inventory with category details

    const [inventoryRows] = await db.query(`
  SELECT 
    i.id, 
    i.item_name, 
    i.stock_quantity, 
    i.unit, 
    i.updated_at,
    c.id AS category_id, 
    c.category_name, 
    c.CGST, 
    c.SGST
  FROM inventory i
  LEFT JOIN categories c ON i.category_id = c.id
  WHERE i.is_deleted = 0
`);


    // 2️⃣ Fetch all products linked to inventory items (average MRP)
    const [productRows] = await db.query(`
      SELECT 
        p.inventory_item_id,
        AVG(p.mrp) AS avg_mrp,       
        AVG(p.saleMrp) AS avg_saleMrp
      FROM products p
      GROUP BY p.inventory_item_id
    `);

    const productMap = {};
    for (const p of productRows) {
      productMap[p.inventory_item_id] = {
        avgMrp: Number(p.avg_mrp) || 0,
        avgSaleMrp: Number(p.avg_saleMrp) || 0,
      };
    }

    // 3️⃣ Fetch invoices and parse items (with date filter)
    let invoiceQuery = `SELECT items FROM invoices WHERE 1=1`;
    const queryParams = [];

    if (startDate && endDate) {
      invoiceQuery += ` AND DATE(created_at) BETWEEN ? AND ?`;
      queryParams.push(startDate, endDate);
    }

    const [invoiceRows] = await db.query(invoiceQuery, queryParams);

    const soldCountMap = {};

    for (const inv of invoiceRows) {
      let items = [];
      try {
        if (typeof inv.items === "string") {
          items = JSON.parse(inv.items || "[]");
        } else if (Array.isArray(inv.items)) {
          items = inv.items;
        } else if (typeof inv.items === "object" && inv.items !== null) {
          items = [inv.items];
        }
      } catch (err) {
        console.warn("⚠️ Skipping invalid invoice item JSON:", inv.items);
      }

      items.forEach((item) => {
        const id = item.inventory_item_id;
        if (!soldCountMap[id]) {
          soldCountMap[id] = { totalQty: 0, totalAmount: 0 };
        }
        soldCountMap[id].totalQty += Number(item.qty) || 0;
        soldCountMap[id].totalAmount += Number(item.amount) || 0;
      });
    }

    // 4️⃣ Merge data
    let analytics = inventoryRows
      .filter((inv) => {
        // ✅ If show_all=false → only sold items in date range
        if (show_all === "false" || show_all === "0") {
          return soldCountMap[inv.id] && soldCountMap[inv.id].totalQty > 0;
        }
        return true; // default show all
      })
      .map((inv) => {
        const soldData = soldCountMap[inv.id] || { totalQty: 0, totalAmount: 0 };
        const productData = productMap[inv.id] || {
          avgMrp: 0,
          avgSaleMrp: 0,
        };

        const stockDisplay =
          inv.stock_quantity >= 1000
            ? `${Math.floor(inv.stock_quantity / 1000)} kg ${(inv.stock_quantity % 1000).toFixed(2)} g`
            : `${inv.stock_quantity} g`;

        const totalMrpAmount = soldData.totalQty * productData.avgMrp;
        const profitAmount = totalMrpAmount - soldData.totalAmount;

        return {
          id: inv.id,
          item_name: inv.item_name,
          category_id: inv.category_id,
          category_name: inv.category_name,
          CGST: inv.CGST,
          SGST: inv.SGST,
          unit: inv.unit,
          stock_quantity: inv.stock_quantity,
          stock_display: stockDisplay,
          total_sold_qty: soldData.totalQty,
          total_sales_amount: soldData.totalAmount,
          total_mrp_amount: totalMrpAmount,
          profit_amount: Math.abs(profitAmount),
        };
      });

    // 5️⃣ Sort by most sold
    analytics.sort((a, b) => b.total_sold_qty - a.total_sold_qty);

    // 6️⃣ Compute totals for summary
    const totals = analytics.reduce(
      (acc, item) => {
        acc.total_sold_qty += item.total_sold_qty;
        acc.total_sales_amount += item.total_sales_amount;
        acc.total_mrp_amount += item.total_mrp_amount;
        acc.total_profit_amount += item.profit_amount;
        return acc;
      },
      { total_sold_qty: 0, total_sales_amount: 0, total_mrp_amount: 0, total_profit_amount: 0 }
    );

    // ✅ Final Response
    res.status(200).json({
      filter: { start_date: startDate, end_date: endDate },
      show_all: show_all !== "false",
      total_items: analytics.length,
      ...totals,
      data: analytics,
    });
  } catch (error) {
    console.error("❌ Error listing inventory:", error);
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
      SELECT i.id, i.item_name, i.stock_quantity, i.unit, i.updated_at,
             c.id AS category_id, c.category_name, c.CGST, c.SGST
      FROM inventory i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?
    `;
    const [rows] = await db.query(query, [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const item = rows[0];
    const stockDisplay =
      item.stock_quantity >= 1000
        ? `${Math.floor(item.stock_quantity / 1000)} kg ${(item.stock_quantity % 1000).toFixed(2)} g`
        : `${item.stock_quantity} g`;

    res.status(200).json({ ...item, stock_display: stockDisplay });
  } catch (error) {
    console.error("❌ Error fetching inventory by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete Inventory
exports.deleteInventory = async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const inventoryId = req.params.inventoryId;

    const db = await getUserDbConnection(dbName);

    const [result] = await db.query(
      `UPDATE inventory SET is_deleted = 1 WHERE id = ?`,
      [inventoryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Inventory item soft-deleted successfully" });
  } catch (error) {
    console.error("❌ Error soft-deleting inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

