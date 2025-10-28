CREATE TABLE company_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    slogan VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    node_mail VARCHAR(255),
    node_password VARCHAR(255) NOT NULL,
    gstNumber VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    logo TEXT,
    state VARCHAR(255),
    country VARCHAR(255),
    bank_details JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);