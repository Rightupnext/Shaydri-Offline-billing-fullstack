const getUserDbConnection = require("../../getUserDbConnection");
const path = require("path");
const fs = require("fs");

// ---------------------------
// UPSERT company profile
// ---------------------------
exports.upsertCompanyProfile = async (req, res) => {
  const db_name = req.params.dbName;
  const {
    company_name,
    slogan,
    phone,
    email,
    node_mail = "",
    node_password = "",
    gstNumber,
    address,
    state,
    country,
    bank_details
  } = req.body;

  let bankDetailsObj = bank_details;
  if (typeof bank_details === "string") {
    try {
      bankDetailsObj = JSON.parse(bank_details);
    } catch (err) {
      return res.status(400).json({ message: "Invalid bank_details JSON" });
    }
  }

  const newLogo = req.logoFileName || null;

  try {
    const userDb = await getUserDbConnection(db_name);
    const [existing] = await userDb.query("SELECT * FROM company_profiles LIMIT 1");

    const baseUploadDir = path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "RightupNext Billing Software",
      "uploads"
    );

    if (existing.length > 0) {
      const oldLogo = existing[0].logo;

      if (newLogo && oldLogo) {
        const oldLogoPath = path.join(baseUploadDir, oldLogo);
        if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
      }

      await userDb.query(
        `UPDATE company_profiles SET
          company_name=?, slogan=?, phone=?, email=?, node_mail=?, node_password=?,
          gstNumber=?, address=?, logo=?, state=?, country=?, bank_details=?, updated_at=NOW()
         WHERE id = ?`,
        [
          company_name,
          slogan,
          phone,
          email,
          node_mail,
          node_password,
          gstNumber,
          address,
          newLogo || oldLogo,
          state,
          country,
          JSON.stringify(bankDetailsObj), // <--- save as JSON string
          existing[0].id
        ]
      );

      return res.json({ message: "Company profile updated successfully" });
    } else {
      await userDb.query(
        `INSERT INTO company_profiles (
          company_name, slogan, phone, email, node_mail, node_password,
          gstNumber, address, logo, state, country, bank_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company_name,
          slogan,
          phone,
          email,
          node_mail,
          node_password,
          gstNumber,
          address,
          newLogo,
          state,
          country,
          JSON.stringify(bankDetailsObj) // <--- save as JSON string
        ]
      );

      return res.json({ message: "Company profile created successfully" });
    }
  } catch (err) {
    console.error("❌ Error saving company profile:", err);
    return res.status(500).json({ message: "Failed to save company profile" });
  }
};

// ---------------------------
// GET company profile
// ---------------------------
exports.getCompanyProfile = async (req, res) => {
  const db_name = req.params.dbName;
  try {
    const userDb = await getUserDbConnection(db_name);
    const [rows] = await userDb.query("SELECT * FROM company_profiles LIMIT 1");
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch company profile" });
  }
};
