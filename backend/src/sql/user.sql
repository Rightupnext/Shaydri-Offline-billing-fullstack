-- USERS table (with unique db_name)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    device_ids JSON DEFAULT NULL, -- 🔹 Store array of device IDs like ["dev123", "dev456"]
    device_limit INT DEFAULT 1,   -- 🔹 Limit for maximum devices
    db_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g. rightupnext_user_3',
    role ENUM('admin', 'super-admin', 'employee') NOT NULL DEFAULT 'employee',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SUBSCRIPTIONS table (foreign key referencing users.db_name)
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    db_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    account ENUM('trail','starter' ,'pro') NOT NULL DEFAULT 'trail',
    subscription_start DATETIME DEFAULT NULL,
    subscription_end DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (db_name) REFERENCES users(db_name) ON DELETE CASCADE
);
