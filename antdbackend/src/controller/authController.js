const db = require("../../db");
const bcrypt = require("../utils/password");
const jwt = require("../utils/jwt");
const { hashPassword } = require("../utils/password");
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log("📥 Registering:", name, email);
    // 1. Check if user already exists
    const [userExists] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 2. Hash the password
    const hashedPassword = await hashPassword(password);

    // 3. Generate db name
    const cleanName = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const dbName = `rightupnext_${cleanName}`;
    const defaultDeviceIds = JSON.stringify(["rightup1"]);

    // 4. Insert user into `users` table
    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, db_name, device_ids)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, dbName, defaultDeviceIds]
    );

    const userId = result.insertId;
    if (!userId) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    console.log("✅ User created with ID:", userId);

    // 5. Create user-specific database
    await db.query(`CREATE DATABASE \`${dbName}\``);
    console.log("✅ Database created:", dbName);

    // 6. Insert into subscriptions table
    await db.query(
      `INSERT INTO subscriptions 
       (db_name, account, amount, subscription_start, subscription_end) 
       VALUES (?, 'trail', 0, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY))`,
      [dbName]
    );

    console.log("✅ Trial subscription created for:", dbName);

    // 7. Generate JWT token
    const token = jwt.generateToken({ id: userId, role: "user" });

    return res.status(200).json({
      message: "Registration successful",
      token,
      db_name: dbName,
    });

  } catch (err) {
    console.error("❌ Registration Error:", err);
    return res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Fix: Ensure device_ids is always a valid array
    let parsedDeviceIds = [];

    if (!user.device_ids) {
      parsedDeviceIds = ["rightup1"];
      await db.query("UPDATE users SET device_ids = ? WHERE id = ?", [
        JSON.stringify(parsedDeviceIds),
        user.id,
      ]);
    } else {
      try {
        const parsed = JSON.parse(user.device_ids);
        parsedDeviceIds = Array.isArray(parsed) ? parsed.flat() : [parsed];
      } catch (e) {
        parsedDeviceIds = [user.device_ids];
        await db.query("UPDATE users SET device_ids = ? WHERE id = ?", [
          JSON.stringify(parsedDeviceIds),
          user.id,
        ]);
      }
    }

    const token = jwt.generateToken(user);

    res.json({
      message: "Login successful",
      token,
      db_name: user.db_name,
      user: {
        id: user.id,
        name: user.name,
        db_name: user.db_name,
        email: user.email,
        role: user.role,
        device_ids: parsedDeviceIds,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};


