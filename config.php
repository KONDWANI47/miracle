<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'miracle_ecd');
define('DB_USER', 'miracle_user');
define('DB_PASS', 'miracle_password');

// Email Configuration
define('ADMIN_EMAIL', 'admin@miracleecd.com');
define('ADMIN_PHONE', '+265992260985');
define('SITE_NAME', 'MIRACLE ECD');
define('SITE_URL', 'http://localhost:8000');

// Payment Configuration
define('PAYMENT_METHODS', [
    'airtel_money' => 'Airtel Money',
    'tnm_mpamba' => 'TNM Mpamba',
    'bank_transfer' => 'Bank Transfer',
    'cash' => 'Cash Payment'
]);

// Program Configuration
define('PROGRAMS', [
    'early_childhood' => 'Early Childhood Care (0-5 years)',
    'foundation' => 'Foundation Program (5-7 years)',
    'primary_prep' => 'Primary Preparation (7-12 years)'
]);

// File Upload Configuration
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'pdf']);

// Security Configuration
define('JWT_SECRET', 'your-secret-key-here');
define('SESSION_TIMEOUT', 3600); // 1 hour

// Error Reporting (set to false in production)
define('DEBUG_MODE', true);

if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Africa/Blantyre');

// Database connection function
function getDBConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        if (DEBUG_MODE) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        } else {
            throw new Exception("Database connection failed");
        }
    }
}

// Email sending function
function sendEmail($to, $subject, $message, $headers = '') {
    $default_headers = "MIME-Version: 1.0" . "\r\n";
    $default_headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $default_headers .= "From: " . SITE_NAME . " <noreply@" . $_SERVER['HTTP_HOST'] . ">" . "\r\n";
    
    $full_headers = $headers ? $headers . "\r\n" . $default_headers : $default_headers;
    
    return mail($to, $subject, $message, $full_headers);
}

// Logging function
function logActivity($message, $type = 'info') {
    $log_file = 'logs/activity.log';
    $log_dir = dirname($log_file);
    
    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] [$type] $message" . PHP_EOL;
    
    file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
}

// Sanitize input function
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// Validate email function
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

// Generate unique reference function
function generateReference($prefix = 'REG') {
    return $prefix . '-' . date('Y') . '-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
}

// Format currency function
function formatCurrency($amount, $currency = 'MWK') {
    return $currency . ' ' . number_format($amount, 2);
}

// Get age group function
function getAgeGroup($age) {
    if ($age < 5) return 'Early Childhood Care (0-5 years)';
    if ($age < 7) return 'Foundation Program (5-7 years)';
    if ($age <= 12) return 'Primary Preparation (7-12 years)';
    return 'Age group not specified';
}

// Calculate days between dates
function getDaysBetween($start_date, $end_date = null) {
    if (!$end_date) {
        $end_date = date('Y-m-d');
    }
    
    $start = new DateTime($start_date);
    $end = new DateTime($end_date);
    $interval = $start->diff($end);
    
    return $interval->days;
}
?>