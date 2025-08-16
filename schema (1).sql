-- MIRACLE ECD Database Schema
-- This file provides the database structure for a full implementation
-- Currently, the website uses localStorage for demo purposes

-- Create database
CREATE DATABASE miracle_ecd;
USE miracle_ecd;

-- Registrations table
CREATE TABLE registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    child_name VARCHAR(255) NOT NULL,
    child_age INT NOT NULL,
    start_date DATE NOT NULL,
    program VARCHAR(100) NOT NULL,
    message TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Payment Required', 'Paid', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_id VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    registration_id INT NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MWK',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_method VARCHAR(50) DEFAULT 'Card',
    stripe_payment_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

-- Announcements table
CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('info', 'urgent', 'event', 'notice') DEFAULT 'info',
    expiry_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'admin'
);

-- Gallery table
CREATE TABLE gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    image_alt VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(255) DEFAULT 'admin'
);

-- User uploads table
CREATE TABLE user_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uploader_name VARCHAR(255) NOT NULL,
    uploader_email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_date TIMESTAMP NULL,
    reviewed_by VARCHAR(255) NULL,
    rejection_reason TEXT NULL
);

-- Payment settings table
CREATE TABLE payment_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_name VARCHAR(100) NOT NULL UNIQUE,
    setting_value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MWK',
    description TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) DEFAULT 'admin'
);

-- Admin users table
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'viewer') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact messages table
CREATE TABLE contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    replied_at TIMESTAMP NULL,
    replied_by VARCHAR(255) NULL
);

-- Newsletter subscribers table
CREATE TABLE newsletter_subscribers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('active', 'unsubscribed') DEFAULT 'active',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL
);

-- Insert default payment settings
INSERT INTO payment_settings (setting_name, setting_value, description) VALUES
('registration_fee', 50.00, 'One-time registration fee'),
('early_childhood_care_monthly', 150.00, 'Monthly fee for early childhood care (0-5 years)'),
('foundation_program_monthly', 120.00, 'Monthly fee for foundation program (5-7 years)'),
('primary_preparation_monthly', 100.00, 'Monthly fee for primary preparation (7-12 years)');

-- Create indexes for better performance
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_date ON registrations(registration_date);
CREATE INDEX idx_payments_registration ON payments(registration_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_expiry ON announcements(expiry_date);
CREATE INDEX idx_gallery_active ON gallery(is_active);
CREATE INDEX idx_user_uploads_status ON user_uploads(status);

-- Create views for common queries
CREATE VIEW active_registrations AS
SELECT * FROM registrations 
WHERE status IN ('Paid', 'Approved', 'Completed');

CREATE VIEW pending_payments AS
SELECT r.*, p.amount, p.payment_date 
FROM registrations r 
LEFT JOIN payments p ON r.id = p.registration_id 
WHERE r.status = 'Payment Required' OR p.status = 'Pending';

CREATE VIEW active_announcements AS
SELECT * FROM announcements 
WHERE is_active = TRUE 
AND (expiry_date IS NULL OR expiry_date > CURDATE())
ORDER BY created_date DESC;

-- Stored procedures for common operations

-- Procedure to update registration status
DELIMITER //
CREATE PROCEDURE UpdateRegistrationStatus(
    IN reg_id INT,
    IN new_status VARCHAR(50),
    IN updated_by VARCHAR(255)
)
BEGIN
    UPDATE registrations 
    SET status = new_status, 
        last_updated = CURRENT_TIMESTAMP 
    WHERE id = reg_id;
    
    -- Log the status change (you could create a separate audit table)
    INSERT INTO contact_messages (name, email, subject, message, status) VALUES
    (updated_by, 'system@miracleecd.com', 'Status Update', 
     CONCAT('Registration ', reg_id, ' status changed to ', new_status), 'read');
END //
DELIMITER ;

-- Procedure to process payment
DELIMITER //
CREATE PROCEDURE ProcessPayment(
    IN reg_id INT,
    IN payment_amount DECIMAL(10,2),
    IN stripe_payment_id VARCHAR(255),
    IN stripe_charge_id VARCHAR(255)
)
BEGIN
    DECLARE parent_name_var VARCHAR(255);
    
    -- Get parent name from registration
    SELECT parent_name INTO parent_name_var 
    FROM registrations 
    WHERE id = reg_id;
    
    -- Insert payment record
    INSERT INTO payments (
        registration_id, parent_name, amount, status, 
        stripe_payment_id, stripe_charge_id
    ) VALUES (
        reg_id, parent_name_var, payment_amount, 'Completed',
        stripe_payment_id, stripe_charge_id
    );
    
    -- Update registration status
    UPDATE registrations 
    SET status = 'Paid', payment_status = 'Completed', payment_id = LAST_INSERT_ID()
    WHERE id = reg_id;
END //
DELIMITER ;

-- Function to get registration statistics
DELIMITER //
CREATE FUNCTION GetRegistrationCount(status_filter VARCHAR(50))
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE count_result INT;
    
    IF status_filter = 'all' THEN
        SELECT COUNT(*) INTO count_result FROM registrations;
    ELSE
        SELECT COUNT(*) INTO count_result FROM registrations WHERE status = status_filter;
    END IF;
    
    RETURN count_result;
END //
DELIMITER ;

-- Trigger to automatically update timestamps
DELIMITER //
CREATE TRIGGER update_registration_timestamp
    BEFORE UPDATE ON registrations
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Sample data for testing (optional)
INSERT INTO announcements (title, content, type, expiry_date) VALUES
('Welcome to MIRACLE ECD!', 'We are excited to welcome new families to our early childhood development center. Our experienced staff is dedicated to providing quality care and education for your children.', 'info', NULL),
('Registration Open for 2024', 'Registration is now open for the 2024 academic year. Limited spaces available. Apply early to secure your child\'s spot!', 'urgent', '2024-12-31'),
('Parent-Teacher Meeting', 'Join us for our quarterly parent-teacher meeting on Saturday, March 15th at 10:00 AM. We will discuss your child\'s progress and upcoming activities.', 'event', '2024-03-15');

INSERT INTO gallery (title, description, image_url, display_order) VALUES
('Classroom Activities', 'Children engaged in various learning activities in our modern classrooms.', '/placeholder.svg?height=300&width=400', 1),
('Outdoor Play', 'Kids enjoying outdoor activities in our safe and secure playground.', '/placeholder.svg?height=300&width=400', 2),
('Art and Crafts', 'Creative expression through art and craft activities.', '/placeholder.svg?height=300&width=400', 3);

-- End of schema
