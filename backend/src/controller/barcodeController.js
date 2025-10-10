const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js");
const { createCanvas, loadImage } = require("canvas");
const getUserDbConnection = require("../../getUserDbConnection");
const WebSocketManager = require("../../src/webSocket/webSocket.js");
exports.generateBarcode = async (req, res) => {
  try {
    const { dbName, productId } = req.params;
    const db = await getUserDbConnection(dbName);

    // 📌 Fetch product details
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    const product = rows[0];

    // ✅ Handle missing values
    const productPrice = product.mrp
      ? parseFloat(product.mrp).toFixed(2)
      : "0.00";
    const productSalePrice = product.saleMrp
      ? parseFloat(product.saleMrp).toFixed(2)
      : "0.00";
    const mfgDate = product.mfg_date || "N/A";
    const expDate = product.exp_date || "N/A";

    // ✅ Generate Barcode ID
    const productNamePart = product.product_name.substring(0, 3).toUpperCase();
    const tenantIdPart = dbName.slice(-3).toUpperCase();
    const barcodeId = `${productId}-${productNamePart}-${tenantIdPart}`;

    // 📌 Define tenant-based barcode directory
    const tenantBarcodeDir = path.join(__dirname, "../../barcodes", dbName);

    // ✅ Check & Create directory if not exists
    if (!fs.existsSync(tenantBarcodeDir)) {
      fs.mkdirSync(tenantBarcodeDir, { recursive: true });
    }

    // 📌 Define barcode file path inside tenant folder
    const barcodeFileName = `barcode_${barcodeId}.png`;
    const barcodeFilePath = path.join(tenantBarcodeDir, barcodeFileName);

    // 📌 Generate High-Quality Barcode Image Buffer
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: barcodeId,
      scale: 5,
      height: 40,
      includetext: true,
      textxalign: "center",
      backgroundcolor: "FFFFFF",
    });

    // ✅ Create High-Resolution Canvas (600x600 pixels)
    const canvasWidth = 600;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight, "png");
    const ctx = canvas.getContext("2d");

    // ✅ Set High-Quality Rendering
    ctx.quality = "best";
    ctx.patternQuality = "best";
    ctx.textRendering = "geometricPrecision";
    ctx.imageSmoothingEnabled = true;

    // Background color
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ✅ Add Product Information
    ctx.fillStyle = "black";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(product.product_name.toUpperCase(), canvasWidth / 2, 80);

    ctx.font = "bold 28px Arial";
    ctx.fillText(`MRP: ${productPrice}`, canvasWidth / 4, 140);
    ctx.fillText(`Sale: ${productSalePrice}`, (canvasWidth / 4) * 3, 140);

    // Format Date
    const formatDate = (date) => {
      if (!date || date === "N/A") return "N/A";
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getFullYear()}`;
    };

    const formattedMfgDate = formatDate(mfgDate);
    const formattedExpDate = formatDate(expDate);

    // ✅ Draw formatted dates on canvas
    ctx.fillText(`MFG: ${formattedMfgDate}`, canvasWidth / 4, 200);
    ctx.fillText(`EXP: ${formattedExpDate}`, (canvasWidth / 4) * 3, 200);

    // ✅ Load & Draw High-Quality Barcode Image
    const barcodeImg = await loadImage(barcodeBuffer);
    const barcodeWidth = 500;
    const barcodeHeight = 150;
    const barcodeX = (canvasWidth - barcodeWidth) / 2;
    const barcodeY = 250;

    ctx.drawImage(barcodeImg, barcodeX, barcodeY, barcodeWidth, barcodeHeight);

    // ✅ Barcode ID Below Barcode
    ctx.font = "bold 30px Arial";
    ctx.fillText(barcodeId, canvasWidth / 2, 450);
    ctx.fillText("POS 1.6 ANDROID", canvasWidth / 2, 500);

    // ✅ Save Barcode Image in Tenant-Specific Folder
    const out = fs.createWriteStream(barcodeFilePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", async () => {
      // 📌 Save ONLY the filename in the database
      await db.query(
        "UPDATE products SET barcode_id = ?, barcode_path = ?,barcode_status = 'barcode updated' WHERE id = ?",
        [barcodeId, barcodeFileName, productId] // ✅ Store only the filename
      );

      // 📌 Construct the full URL for response
      const barcodeURL = `http://localhost:5001/barcodes/${dbName}/${barcodeFileName}`;

      res.status(200).json({
        message: "Barcode generated successfully",
        barcode_id: barcodeId,
        barcode_url: barcodeURL,
      });
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// ✅ Scan Product by Barcode
exports.scanProductByBarcode = async (req, res) => {
  try {
    const { dbName, deviceId } = req.params;
    const { barcode_id } = req.body;
    // console.log("first",dbName, deviceId,barcode_id)
    if (!barcode_id) {
      return res.status(400).json({ message: "❌ Barcode ID is required" });
    }

    // console.log(`🔍 Scanning for DB: ${dbName}, Device: ${deviceId}, Barcode: ${barcode_id}`);

    const db = await getUserDbConnection(dbName);

    const [rows] = await db.query(
      `SELECT 
        p.id, p.product_name, p.category_id, p.kilo, p.grams, 
        p.mrp, p.saleMrp, p.exp_date, p.mfg_date, p.barcode_id, 
        p.barcode_path, p.barcode_status, c.category_name, c.CGST, c.SGST, p.unit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode_id = ?`,
      [barcode_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `❌ Product with barcode "${barcode_id}" not found for database "${dbName}"`,
      });
    }

    const product = rows[0];
    const barcodeURL = product.barcode_path
      ? `http://localhost:5001/barcodes/${dbName}/${product.barcode_path}`
      : null;

    const scannedProduct = {
      id: product.id,
      dbName,
      product_name: product.product_name,
      category_id: product.category_id,
      category_name: product.category_name,
      CGST: product.CGST,
      SGST: product.SGST,
      kilo: product.kilo,
      grams: product.grams,
      mrp: product.mrp,
      saleMrp: product.saleMrp,
      exp_date: product.exp_date,
      mfg_date: product.mfg_date,
      barcode_id: product.barcode_id,
      barcode_url: barcodeURL,
      barcode_status: product.barcode_status,
      unit: product.unit,
      deviceId, // attach deviceId for future expansion
    };

    // Send scanned product via WebSocket
    WebSocketManager.sendScannedProduct(scannedProduct);

    res.status(200).json({
      success: true,
      message: "✅ Product details fetched successfully",
      product: scannedProduct,
    });
  } catch (error) {
    console.error("❌ Error fetching product by barcode:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ✅ Reset Scanned Product
exports.resetScannedProduct = async (req, res) => {
  try {
    const emptyProduct = {
      id: null,
      product_name: "",
      category_id: null,
      category_name: "",
      CGST: "0.00",
      SGST: "0.00",
      kilo: 0,
      grams: 0,
      mrp: "0.00",
      saleMrp: "0.00",
      exp_date: null,
      mfg_date: null,
      barcode_id: "",
      barcode_url: null,
      barcode_status: "",
    };

    webSocketManager.sendScannedProduct(emptyProduct);

    res.status(200).json({
      message: "Scanned product reset successfully",
      product: emptyProduct,
    });
  } catch (error) {
    console.error("❌ Error resetting scanned product:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get Barcode Image
exports.getProductBarcodeImage = async (req, res) => {
  try {
    const { dbName, productId } = req.params;
    const db = await getUserDbConnection(dbName);

    const [rows] = await db.query(
      "SELECT barcode_path FROM products WHERE id = ?",
      [productId]
    );

    if (rows.length === 0 || !rows[0].barcode_path) {
      return res.status(404).json({ message: "Barcode not found" });
    }

    const barcodeFilePath = path.join(
      __dirname,
      "../../barcodes",
      dbName,
      rows[0].barcode_path
    );

    if (!fs.existsSync(barcodeFilePath)) {
      return res.status(404).json({ message: "Barcode image not found" });
    }

    res.sendFile(barcodeFilePath);
  } catch (error) {
    console.error("❌ Error fetching barcode image:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update All Barcodes
exports.updateAllBarcodeIds = async (req, res) => {
  try {
    const { dbName } = req.params;
    const { barcodeIds } = req.body;

    if (!Array.isArray(barcodeIds) || barcodeIds.length === 0) {
      return res.status(400).json({ message: "Invalid barcode IDs format" });
    }

    const db = await getUserDbConnection(dbName);
    let updatedCount = 0;

    for (const barcodeId of barcodeIds) {
      if (barcodeId === "No Bar code Id Generate") continue;

      const [rows] = await db.query(
        "SELECT id FROM products WHERE barcode_id = ?",
        [barcodeId]
      );

      if (rows.length === 0) continue;

      const productId = rows[0].id;
      await generateBarcodeForUpdate(dbName, productId, db);
      updatedCount++;
    }

    res
      .status(200)
      .json({
        message: `Updated ${updatedCount} barcode records successfully`,
      });
  } catch (error) {
    console.error("❌ Error updating barcode IDs:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Barcode Regenerator Helper
const generateBarcodeForUpdate = async (dbName, productId, db) => {
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);
    if (rows.length === 0) return;

    const product = rows[0];
    const productPrice = product.mrp
      ? parseFloat(product.mrp).toFixed(2)
      : "0.00";
    const productSalePrice = product.saleMrp
      ? parseFloat(product.saleMrp).toFixed(2)
      : "0.00";
    const mfgDate = product.mfg_date || "N/A";
    const expDate = product.exp_date || "N/A";

    const productNamePart = product.product_name.substring(0, 3).toUpperCase();
    const dbIdPart = dbName.slice(-3).toUpperCase();
    const barcodeId = `${productId}-${productNamePart}-${dbIdPart}`;

    const tenantBarcodeDir = path.join(__dirname, "../../barcodes", dbName);
    if (!fs.existsSync(tenantBarcodeDir))
      fs.mkdirSync(tenantBarcodeDir, { recursive: true });

    const barcodeFileName = `barcode_${barcodeId}.png`;
    const barcodeFilePath = path.join(tenantBarcodeDir, barcodeFileName);

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: barcodeId,
      scale: 5,
      height: 40,
      includetext: true,
      textxalign: "center",
      backgroundcolor: "FFFFFF",
    });

    const canvas = createCanvas(600, 600, "png");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.font = "bold 36px Arial";
    ctx.fillText(product.product_name.toUpperCase(), 300, 80);
    ctx.font = "bold 28px Arial";
    ctx.fillText(`MRP: ${productPrice}`, 150, 140);
    ctx.fillText(`Sale: ${productSalePrice}`, 450, 140);

    const formatDate = (date) => {
      if (!date || date === "N/A") return "N/A";
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getFullYear()}`;
    };

    ctx.fillText(`MFG: ${formatDate(mfgDate)}`, 150, 200);
    ctx.fillText(`EXP: ${formatDate(expDate)}`, 450, 200);

    const barcodeImg = await loadImage(barcodeBuffer);
    ctx.drawImage(barcodeImg, 50, 250, 500, 150);
    ctx.font = "bold 30px Arial";
    ctx.fillText(barcodeId, 300, 450);
    ctx.fillText("POS 1.6 ANDROID", 300, 500);

    const out = fs.createWriteStream(barcodeFilePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    return new Promise((resolve, reject) => {
      out.on("finish", async () => {
        await db.query(
          "UPDATE products SET barcode_id = ?, barcode_path = ? WHERE id = ?",
          [barcodeId, barcodeFileName, productId]
        );
        resolve();
      });
      out.on("error", reject);
    });
  } catch (error) {
    console.error(
      `❌ Error generating barcode for Product ID ${productId}:`,
      error
    );
  }
};
