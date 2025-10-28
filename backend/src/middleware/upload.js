const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Mapping of MIME types to file extensions
const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
};

// Image processing middleware
const processImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const dbName = req.params.dbName;
    if (!dbName) return res.status(400).json({ message: "db_name is required" });

    const ext = mimeToExtension[req.file.mimetype];
    if (!ext) return res.status(400).json({ message: "Unsupported image format" });

    const filename = `logo_${Date.now()}.${ext}`;
    const outputDir = path.join(__dirname, `../../uploads/logo/${dbName}`);
    const outputPath = path.join(outputDir, filename);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (ext === "gif") {
      // GIF files not processed by sharp
      fs.writeFileSync(outputPath, req.file.buffer);
    } else {
      const processedBuffer = await sharp(req.file.buffer)
        .resize({ width: 800, fit: "inside" })
        .toFormat(ext, { quality: 60 })
        .toBuffer();
      fs.writeFileSync(outputPath, processedBuffer);
    }

    // Save the file path for the DB or further use
    req.logoFileName = `logo/${dbName}/${filename}`;
    return next();
  } catch (err) {
    console.error("❌ Image Processing Error:", err.message);
    return res.status(500).json({ message: "Image processing failed" });
  }
};

module.exports = { upload, processImage };