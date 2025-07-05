-- MIRACLE ECD Full Database Schema
-- Production-ready database structure with indexes, constraints, and triggers

CREATE DATABASE IF NOT EXISTS miracle_ecd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE miracle_ecd;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create admin_users table first (referenced by other tables)
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'staff', 'viewer') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_active (is_active),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- Registrations table with enhanced fields
CREATE TABLE registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    child_name VARCHAR(255) NOT NULL,
    child_age INT NOT NULL CHECK (child_age >= 0 AND child_age <= 12),
    child_gender ENUM('male', 'female', 'other') NULL,
    start_date DATE NOT NULL,
    program ENUM('Early Childhood Care', 'Foundation Program', 'Primary Preparation') NOT NULL,
    message TEXT NULL,
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    medical_conditions TEXT NULL,
    allergies TEXT NULL,
    special_needs TEXT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Payment Required', 'Paid', 'Approved', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending',
    payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded', 'Partial') DEFAULT 'Pending',
    payment_id INT NULL,
    assigned_staff_id INT NULL,
    notes TEXT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_program (program),
    INDEX idx_registration_date (registration_date),
    INDEX idx_start_date (start_date),
    INDEX idx_child_name (child_name),
    INDEX idx_parent_name (parent_name),
    
    FOREIGN KEY (assigned_staff_id) REFERENCES admin_users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_email_phone UNIQUE (email, phone)
) ENGINE=InnoDB;

-- Payments table with comprehensive tracking
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    registration_id INT NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'MWK',
    payment_type ENUM('registration_fee', 'monthly_fee', 'additional_fee', 'refund') DEFAULT 'registration_fee',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NULL,
    status ENUM('Pending', 'Processing', 'Completed', 'Failed', 'Cancelled', 'Refunded') DEFAULT 'Pending',
    payment_method ENUM('Card', 'Bank Transfer', 'Mobile Money', 'Cash', 'Cheque') DEFAULT 'Card',
    transaction_reference VARCHAR(255) NULL,
    stripe_payment_id VARCHAR(255) NULL,
    stripe_charge_id VARCHAR(255) NULL,
    stripe_refund_id VARCHAR(255) NULL,
    gateway_response TEXT NULL,
    failure_reason TEXT NULL,
    processed_by INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_registration_id (registration_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date),
    INDEX idx_payment_method (payment_method),
    INDEX idx_payment_type (payment_type),
    INDEX idx_stripe_payment_id (stripe_payment_id),
    INDEX idx_transaction_reference (transaction_reference),
    
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Announcements table with rich features
CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500) NULL,
    type ENUM('info', 'urgent', 'event', 'notice', 'news', 'alert') DEFAULT 'info',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    target_audience ENUM('all', 'parents', 'staff', 'students') DEFAULT 'all',
    expiry_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    image_url VARCHAR(500) NULL,
    external_link VARCHAR(500) NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT NULL,
    
    INDEX idx_active (is_active),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX
