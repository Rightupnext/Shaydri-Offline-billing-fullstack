const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const os = require("os");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
};

// Process + save image
const processImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const dbName = req.params.dbName;
    if (!dbName) return res.status(400).json({ message: "db_name is required" });

    const ext = mimeToExtension[req.file.mimetype];
    if (!ext) return res.status(400).json({ message: "Unsupported image format" });

    // ✅ Save to AppData\RightupNext Billing Software\uploads\logo\<dbName>
    const baseUploadDir = path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "RightupNext Billing Software",
      "uploads"
    );

    const outputDir = path.join(baseUploadDir, "logo", dbName);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filename = `logo_${Date.now()}.${ext}`;
    const outputPath = path.join(outputDir, filename);

    if (ext === "gif") {
      fs.writeFileSync(outputPath, req.file.buffer);
    } else {
      const processedBuffer = await sharp(req.file.buffer)
        .resize({ width: 800, fit: "inside" })
        .toFormat(ext, { quality: 60 })
        .toBuffer();
      fs.writeFileSync(outputPath, processedBuffer);
    }

    // 🔥 Save only relative path to DB (e.g. `logo/dbName/logo_12345.png`)
    req.logoFileName = path.relative(baseUploadDir, outputPath);

    return next();
  } catch (err) {
    console.error("❌ Image Processing Error:", err.message);
    return res.status(500).json({ message: "Image processing failed" });
  }
};

module.exports = { upload, processImage };
