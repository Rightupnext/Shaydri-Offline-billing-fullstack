const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const WebSocketManager = require("./src/webSocket/webSocket");

const authRoutes = require("./src/routes/authRoutes");
const profileroutes = require("./src/routes/companyProfileRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const productRoutes = require("./src/routes/productRoutes");
const invoiceRoutes = require("./src/routes/invoiceRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const whatsappRoutes = require("./src/routes/whatsappRoutes");
const subscriptionRazerpayTenantRoutes = require("./src/routes/subscriptionRazerpayTenantRoutes");
const barcodeGeratorRoutes = require("./src/routes/barcodeGeratorRoutes");

const app = express();
const server = http.createServer(app); // ✅ Combine HTTP and WS

// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/profile", profileroutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/customers", customerRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/whatsapp", whatsappRoutes);
app.use("/subscription", subscriptionRazerpayTenantRoutes);
app.use("/barcode", barcodeGeratorRoutes);
// ------------------------
// 1. Serve uploads as static
// ------------------------
const baseUploadDir = path.join(
  process.env.APPDATA || path.join(require("os").homedir(), "AppData", "Roaming"),
  "RightupNext Billing Software",
  "uploads"
);
// Expose uploads folder at /uploads
app.use("/uploads", express.static(baseUploadDir));

// ✅ Test API
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// ✅ Start WebSocket
WebSocketManager.start(server);
const port=process.env.PORT
// ✅ Start Combined HTTP + WebSocket server
server.listen(port, () => {
  console.log(`🚀 HTTP + WebSocket server running at http://localhost:${port}`);
});
