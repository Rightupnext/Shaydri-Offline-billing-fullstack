-- Inventory Table
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100), 
    category_id INT,
    is_deleted TINYINT(1) DEFAULT 0,
    stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit ENUM('kg', 'g', 'liter', 'ml', 'quintal', 'tonne', 'gram', 'milligram', 'dozen', 'piece') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stock Transactions Table
CREATE TABLE stock_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT,
    transaction_type ENUM('add', 'reduce') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit ENUM('kg', 'g', 'liter', 'ml', 'quintal', 'tonne', 'gram', 'milligram', 'dozen', 'piece') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- Trigger to Update Stock After Transaction Insert
DELIMITER $$

CREATE TRIGGER stock_update_trigger
AFTER INSERT ON stock_transactions
FOR EACH ROW
BEGIN
    -- Update inventory stock based on the transaction type
    IF NEW.transaction_type = 'add' THEN
        UPDATE inventory 
        SET stock_quantity = stock_quantity + NEW.quantity 
        WHERE id = NEW.inventory_id;
    ELSEIF NEW.transaction_type = 'reduce' THEN
        UPDATE inventory 
        SET stock_quantity = stock_quantity - NEW.quantity 
        WHERE id = NEW.inventory_id;
    END IF;
END $$

DELIMITER ;

