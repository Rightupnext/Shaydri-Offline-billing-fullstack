const fs = require("fs");
const path = require("path");

const sqlFiles = [
  "invoices.sql",
  "categories.sql",
  "customer.sql",
  "inventory.sql",
  "products.sql",
  "profile.sql",
  "whatsapp_share_messages.sql"
].map(file => fs.readFileSync(path.join(__dirname, `../sql/kovaimannvaasanai/${file}`), "utf-8"));
