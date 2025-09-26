const getUserDbConnection = require('../../getUserDbConnection');

const path = require("path");
const fs = require("fs");

exports.upsertCompanyProfile = async (req, res) => {
 
  const db_name = req.params.dbName;
  const {
    company_name, slogan, phone, email, node_mail,
    node_password, gstNumber, address, state,
    country, bank_details
  } = req.body;

  const newLogo = req.logoFileName || null;

  try {
    const userDb = await getUserDbConnection(db_name);
    const [existing] = await userDb.query('SELECT * FROM company_profiles LIMIT 1');

    if (existing.length > 0) {
      const oldLogo = existing[0].logo;

      // 🔥 Delete old logo if a new one is uploaded and the old exists
      if (newLogo && oldLogo) {
        const oldLogoPath = path.join(__dirname, "../../uploads", oldLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
          // console.log("Old logo deleted:", oldLogoPath);
        }
      }

      await userDb.query(
        `UPDATE company_profiles SET
          company_name=?, slogan=?, phone=?, email=?, node_mail=?, node_password=?,
          gstNumber=?, address=?, logo=?, state=?, country=?, bank_details=?, updated_at=NOW()
         WHERE id = ?`,
        [
          company_name, slogan, phone, email, node_mail, node_password,
          gstNumber, address, newLogo || oldLogo, state, country,
          JSON.stringify(bank_details), existing[0].id
        ]
      );

      res.json({ message: 'Company profile updated successfully' });
    } else {
      await userDb.query(
        `INSERT INTO company_profiles (
          company_name, slogan, phone, email, node_mail, node_password,
          gstNumber, address, logo, state, country, bank_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company_name, slogan, phone, email, node_mail, node_password,
          gstNumber, address, newLogo, state, country, JSON.stringify(bank_details)
        ]
      );

      res.json({ message: 'Company profile created successfully' });
    }
  } catch (err) {
    console.error("❌ Error saving company profile:", err);
    res.status(500).json({ message: 'Failed to save company profile' });
  }
};


// 🔹 Get Profile
exports.getCompanyProfile = async (req, res) => {

  const db_name = req.params.dbName;
// console.log("db_name",db_name)
  try {
    const userDb = await getUserDbConnection(db_name);
    const [rows] = await userDb.query('SELECT * FROM company_profiles LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch company profile' });
  }
};
