const masterConnection = require("../../db");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();
const moment = require("moment");

// 🔐 Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const dbName = req.params.dbName;

    if (!dbName || !amount) {
      return res
        .status(400)
        .json({ error: "Database name and amount are required" });
    }
    // ✅ SHORTEN RECEIPT to max 40 characters
    const shortDb = dbName.replace("rightupnext_", "").slice(-10); // Keep last 10 chars
    const receipt = `rcpt_${shortDb}_${Date.now().toString().slice(-6)}`; // final: ~25-30 chars

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt, // 👈 now safe
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      orderId: order.id,
      amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

// ✅ Verify Razorpay Payment and Update Subscription
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      amount,
    } = req.body;
    const dbName = req.params.dbName;

    // 🔸 Validate input
    if (!dbName || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !amount) {
      return res.status(400).json({ error: "Missing required payment data" });
    }

    // 🔐 Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed (Invalid Signature)" });
    }

    // 🔍 Get current subscription end
    const [subs] = await masterConnection.execute(
      `SELECT subscription_end FROM subscriptions WHERE db_name = ?`,
      [dbName]
    );

    let subscription_start = moment();
    if (subs.length && subs[0].subscription_end) {
      const existingEnd = moment(subs[0].subscription_end);
      if (existingEnd.isAfter(subscription_start)) {
        subscription_start = existingEnd;
      }
    }

    // 🔄 Determine new subscription end & plan
    let subscription_end = moment(subscription_start);
    let accountType = "";
    let deviceLimit = 1;
    let totalDeviceCount = 1;

    if (amount == 18000) {
      subscription_end.add(1, "year");
      accountType = "starter";
      deviceLimit = 2;
      totalDeviceCount = 2;
    } else if (amount == 32000) {
      subscription_end.add(2, "years");
      accountType = "pro";
      deviceLimit = 5;
      totalDeviceCount = 5;
    } else {
      return res.status(400).json({ error: "Invalid subscription amount" });
    }

    const formatted_start = subscription_start.format("YYYY-MM-DD HH:mm:ss");
    const formatted_end = subscription_end.format("YYYY-MM-DD HH:mm:ss");

    // 📦 Generate NEW device IDs only (overwrite old)
    const prefix = dbName.split("_")[1] || "user";
    const newDeviceIds = [];
    for (let i = 1; i <= totalDeviceCount; i++) {
      const padded = i.toString().padStart(2, "0");
      newDeviceIds.push(`${prefix}_start${padded}`);
    }

    // ✅ Update subscriptions table
    await masterConnection.execute(
      `UPDATE subscriptions 
       SET account = ?, amount = ?, subscription_start = ?, subscription_end = ?, updated_at = NOW()
       WHERE db_name = ?`,
      [accountType, amount, formatted_start, formatted_end, dbName]
    );

    // ✅ Overwrite users.device_ids with new ones
    await masterConnection.execute(
      `UPDATE users 
       SET status = 'active',
           device_limit = ?, 
           device_ids = ?, 
           updated_at = NOW()
       WHERE db_name = ?`,
      [deviceLimit, JSON.stringify(newDeviceIds), dbName]
    );

    return res.json({
      message: "✅ Payment verified & subscription activated",
      account: accountType,
      subscription_start_date: formatted_start,
      subscription_end_date: formatted_end,
      device_limit: deviceLimit,
      device_ids: newDeviceIds,
    });
  } catch (error) {
    console.error("❌ Error verifying Razorpay payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Monitor Subscription from Central Users Table
exports.monitorSubscription = async (req, res) => {
  try {
    const dbName = req.params.dbName;

    const [subs] = await masterConnection.execute(
      `SELECT 
         s.subscription_start, 
         s.subscription_end, 
         s.account, 
         s.amount, 
         u.status,
         u.device_ids,
         u.device_limit
       FROM subscriptions s 
       JOIN users u ON s.db_name = u.db_name 
       WHERE s.db_name = ?`,
      [dbName]
    );

    if (subs.length === 0) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const {
      subscription_start,
      subscription_end,
      account,
      amount,
      status,
      device_ids,
      device_limit,
    } = subs[0];

    const now = moment();
    const end = moment(subscription_end);
    const expired = now.isAfter(end);

    const remaining = {
      days: Math.max(0, end.diff(now, "days")),
      hours: Math.max(0, end.diff(now, "hours") % 24),
      minutes: Math.max(0, end.diff(now, "minutes") % 60),
      seconds: Math.max(0, end.diff(now, "seconds") % 60),
    };

    // Safe parsing of device_ids
    const parsedDeviceIds = (() => {
      try {
        const parsed = JSON.parse(device_ids);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return device_ids ? [device_ids] : [];
      }
    })();

    return res.json({
      db_name: dbName,
      account,
      amount,
      status,
      expired,
      subscription_start_date: subscription_start,
      subscription_end_date: subscription_end,
      remaining_time: remaining,
      device_limit: device_limit || 1,
      device_ids: parsedDeviceIds,
    });
  } catch (error) {
    console.error("❌ Error monitoring subscription:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};