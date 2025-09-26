CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    kilo INT DEFAULT 0,
    grams INT DEFAULT 0,
    exp_date DATE,
    mfg_date DATE,
    mrp DECIMAL(10,2),
    saleMrp DECIMAL(10,2) DEFAULT 0,
    barcode_id VARCHAR(50) UNIQUE,
    barcode_path VARCHAR(255) DEFAULT NULL,
    barcode_status ENUM('barcode not generated', 'barcode not updated', 'barcode updated') DEFAULT 'barcode not generated',
    unit ENUM('kg', 'g', 'liter', 'ml', 'quintal', 'tonne', 'gram', 'milligram', 'dozen', 'piece') NOT NULL DEFAULT 'piece',
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
