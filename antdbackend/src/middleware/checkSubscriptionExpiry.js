const masterConnection = require("../../db");
const moment = require("moment");

const checkSubscriptionExpiry = async (req, res, next) => {
  try {
    const db_name = req.params.dbName;

    if (!db_name) {
      return res.status(400).json({
        error: "Database name (dbName) is required",
        status: "missing_db_name",
      });
    }

    // 🔍 Fetch subscription from subscriptions table
    const [subscriptions] = await masterConnection.execute(
      `SELECT subscription_start, subscription_end, account 
       FROM subscriptions 
       WHERE db_name = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [db_name]
    );

    if (subscriptions.length === 0) {
      return res.status(403).json({
        error: "Subscription not found",
        status: "no_subscription",
        message: "No subscription found. Please register or contact support.",
      });
    }

    const { subscription_start, subscription_end, account } = subscriptions[0];
    const now = moment();

    // Check if subscription has expired
    if (!subscription_end || moment(subscription_end).isBefore(now)) {
      return res.status(403).json({
        error: "Subscription expired",
        status: "expired_subscription",
        account,
        message: `Your ${account} subscription has expired. Please renew to continue.`,
      });
    }

    // ✅ Subscription is valid
    req.subscriptionInfo = {
      db_name,
      account,
      subscription_start,
      subscription_end,
    };

    next();
  } catch (error) {
    console.error("❌ Error checking subscription status:", error);
    return res.status(500).json({
      error: "Server error",
      status: "server_error",
      message: "An internal error occurred. Please try again later.",
    });
  }
};

module.exports = checkSubscriptionExpiry;
