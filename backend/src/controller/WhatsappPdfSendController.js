const path = require("path");
const fs = require("fs");
const multer = require("multer");
const getUserDbConnection = require("../../getUserDbConnection");

// Multer memory storage
const storage = multer.memoryStorage();
exports.upload = multer({ storage }).single("file"); // expects field name "file"

// ✅ Use backend/uploads as root for files
const backendUploadDir = path.join(__dirname, "../../uploads");

// Ensure the main uploads folder exists
if (!fs.existsSync(backendUploadDir)) {
  fs.mkdirSync(backendUploadDir, { recursive: true });
  console.log("📁 Created main uploads directory:", backendUploadDir);
}

exports.saveMessageAndSendPDF = async (req, res) => {
  const { dbName } = req.params;
  const { fromNumber, toNumber, message, selectedOption } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required." });
    }

    // -------------------------------
    // ✅ Define tenant folder
    // -------------------------------
    const relativeFolder = path.join(dbName, selectedOption);
    const dbFolder = path.join(backendUploadDir, relativeFolder);

    // ✅ Ensure folder exists
    if (!fs.existsSync(dbFolder)) {
      fs.mkdirSync(dbFolder, { recursive: true });
      console.log("📁 Created folder:", dbFolder);
    }

    // -------------------------------
    // 🧹 Delete old files (>4 days)
    // -------------------------------
    const now = Date.now();
    const fourDays = 4 * 24 * 60 * 60 * 1000;
    fs.readdir(dbFolder, (err, files) => {
      if (err) return console.error("⚠️ Error reading folder:", err);
      files.forEach((file) => {
        const filePath = path.join(dbFolder, file);
        fs.stat(filePath, (err, stats) => {
          if (!err && stats.isFile() && now - stats.mtimeMs > fourDays) {
            fs.unlink(filePath, (err) => {
              if (err) console.error("❌ Failed to delete:", file);
              else console.log("🗑️ Deleted old file:", file);
            });
          }
        });
      });
    });

    // -------------------------------
    // 💾 Save uploaded PDF
    // -------------------------------
    const timestamp = Date.now();
    const originalExt = path.extname(req.file.originalname) || ".pdf";
    const pdfName = `uploaded_${timestamp}${originalExt}`;
    const pdfPath = path.join(dbFolder, pdfName);

    fs.writeFileSync(pdfPath, req.file.buffer);

    // -------------------------------
    // 🗄️ Save metadata in tenant DB
    // -------------------------------
    const tenantDB = await getUserDbConnection(dbName);
    const sql = `
      INSERT INTO whatsapp_share_messages 
        (tenant_id, from_number, to_number, message, selected_option, pdf_file_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await tenantDB.query(sql, [
      dbName,
      fromNumber,
      toNumber,
      message,
      selectedOption,
      path.join(relativeFolder, pdfName),
    ]);

    // -------------------------------
    // 🌐 Return public URL
    // -------------------------------
    const publicUrl = `https://www.shaydri.com/api/uploads/${relativeFolder}/${pdfName}`;
    console.log("✅ PDF saved at:", pdfPath);
    console.log("🌍 Public URL:", publicUrl);

    res.status(200).json({
      success: true,
      downloadUrl: publicUrl,
      message: "PDF uploaded and metadata saved successfully.",
    });
  } catch (err) {
    console.error("❌ Error saving uploaded PDF:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
