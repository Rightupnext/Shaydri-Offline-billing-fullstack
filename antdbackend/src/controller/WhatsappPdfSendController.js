const path = require('path');
const fs = require('fs');
const multer = require('multer');
const getUserDbConnection = require('../../getUserDbConnection');

// Memory storage for multer
const storage = multer.memoryStorage();
exports.upload = multer({ storage }).single('file'); // expects form field "file"

exports.saveMessageAndSendPDF = async (req, res) => {
  const { dbName } = req.params;
  const { fromNumber, toNumber, message, selectedOption } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }

    // ✅ Step 1: Create db-based folder if not exists
    const dbFolder = path.join(__dirname, `../../uploads/${dbName}/${selectedOption}/`);
    if (!fs.existsSync(dbFolder)) {
      fs.mkdirSync(dbFolder, { recursive: true });
    }

    // ✅ Step 2: Delete files older than 4 days
    const now = Date.now();
    const fourDays = 4 * 24 * 60 * 60 * 1000;

    fs.readdir(dbFolder, (err, files) => {
      if (err) return console.error('⚠️ Error reading folder:', err);
      files.forEach((file) => {
        const filePath = path.join(dbFolder, file);
        fs.stat(filePath, (err, stats) => {
          if (!err && stats.isFile() && now - stats.mtimeMs > fourDays) {
            fs.unlink(filePath, (err) => {
              if (err) console.error('❌ Failed to delete old file:', file);
              else console.log('🗑️ Deleted old file:', file);
            });
          }
        });
      });
    });

    // ✅ Step 3: Save PDF to disk
    const timestamp = Date.now();
    const originalExt = path.extname(req.file.originalname) || '.pdf';
    const pdfName = `uploaded_${timestamp}${originalExt}`;
    const pdfPath = path.join(dbFolder, pdfName);

    fs.writeFileSync(pdfPath, req.file.buffer);

    // ✅ Step 4: Save metadata to tenant DB
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
      `/uploads/${dbName}/${selectedOption}/${pdfName}`
    ]);

    // ✅ Step 5: Send response
    res.status(200).json({
      success: true,
      downloadUrl: `/uploads/${dbName}/${selectedOption}/${pdfName}`,
      message: 'PDF uploaded and metadata saved successfully.'
    });
  } catch (err) {
    console.error('❌ Error saving uploaded PDF:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
