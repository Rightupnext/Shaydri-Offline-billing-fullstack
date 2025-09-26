CREATE TABLE whatsapp_share_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  message TEXT,
  selected_option VARCHAR(10),
  pdf_file_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
