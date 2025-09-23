const WebSocket = require("ws");
const url = require("url");

class WebSocketManager {
  constructor() {
    this.clients = new Set();
    this.lastScannedProduct = {};
  }

  start(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws, req) => {
      const parsedUrl = url.parse(req.url, true);
      const pathnameParts = parsedUrl.pathname.split("/").filter(Boolean);

      let dbName = null;
      let deviceId = null;

      // Expecting /{dbName}/get-scan-product/{deviceId}
      if (pathnameParts.length === 3 && pathnameParts[1] === "get-scan-product") {
        dbName = pathnameParts[0];
        deviceId = pathnameParts[2];
      }

      // Log incoming request
      console.log("🌐 Incoming WebSocket:", req.url);
      console.log("🔍 Parsed -> dbName:", dbName, "| deviceId:", deviceId);

      // Attach metadata if provided
      ws.dbName = dbName || "anonymous";
      ws.deviceId = deviceId || "unknown";

      console.log(`🔗 WebSocket connected: DB = ${ws.dbName}, Device = ${ws.deviceId}`);
      this.clients.add(ws);

      ws.on("close", () => {
        console.log(`❌ WebSocket disconnected: DB = ${ws.dbName}, Device = ${ws.deviceId}`);
        this.clients.delete(ws);
      });

      // Send last scanned product if dbName matches (or anonymous clients get all)
      if (
        Object.keys(this.lastScannedProduct).length > 0 &&
        (!ws.dbName || ws.dbName === this.lastScannedProduct.dbName)
      ) {
        ws.send(JSON.stringify({
          event: "scanned_product",
          product: this.lastScannedProduct,
        }));
      }
    });

    console.log("📡 WebSocket server started");
  }

  sendScannedProduct(product) {
    this.lastScannedProduct = product;

    this.clients.forEach((client) => {
      const match =
        client.readyState === WebSocket.OPEN &&
        (client.dbName === product.dbName || client.dbName === "anonymous");

      if (match) {
        client.send(JSON.stringify({
          event: "scanned_product",
          product,
        }));
      }
    });
  }
}

module.exports = new WebSocketManager();
