<?php
// Database configuration
$host = 'localhost';
$dbname = 'miracle_ecd';
$username = 'root';
$password = '';

// Email configuration
$admin_email = 'admin@miracleecd.com';
$admin_phone = '+265992260985';

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Function to create database connection
function createConnection() {
    global $host, $dbname, $username, $password;
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

// Function to create database and tables
function createDatabase() {
    global $host, $username, $password;
    
    try {
        $pdo = new PDO("mysql:host=$host", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create database if not exists
        $pdo->exec("CREATE DATABASE IF NOT EXISTS miracle_ecd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE miracle_ecd");
        
        // Create registrations table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                parent_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                child_name VARCHAR(255) NOT NULL,
                child_age INT NOT NULL,
                program VARCHAR(100) NOT NULL,
                start_date DATE NOT NULL,
                message TEXT,
                payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
                registration_status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                payment_reference VARCHAR(100),
                payment_method VARCHAR(50),
                payment_amount DECIMAL(10,2),
                payment_date TIMESTAMP NULL,
                INDEX idx_email (email),
                INDEX idx_phone (phone),
                INDEX idx_status (registration_status),
                INDEX idx_payment_status (payment_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create payments table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                registration_id INT,
                parent_name VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reference VARCHAR(100) UNIQUE,
                status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
                transaction_id VARCHAR(100),
                notes TEXT,
                FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE SET NULL,
                INDEX idx_registration_id (registration_id),
                INDEX idx_reference (reference),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create notifications table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                data JSON,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_type (type),
                INDEX idx_is_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        return true;
    } catch (PDOException $e) {
        return false;
    }
}

// Function to validate registration data
function validateRegistration($data) {
    $errors = [];
    
    // Required fields
    $required_fields = ['email', 'phone', 'childAge', 'program', 'startDate'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            $errors[] = ucfirst(str_replace(['childAge', 'startDate'], ['child age', 'start date'], $field)) . ' is required';
        }
    }
    
    // Email validation
    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email address';
    }
    
    // Phone validation (basic)
    if (!empty($data['phone']) && strlen($data['phone']) < 10) {
        $errors[] = 'Phone number must be at least 10 digits';
    }
    
    // Age validation
    if (!empty($data['childAge'])) {
        $age = intval($data['childAge']);
        if ($age < 0 || $age > 12) {
            $errors[] = 'Child age must be between 0 and 12 years';
        }
    }
    
    // Date validation
    if (!empty($data['startDate'])) {
        $start_date = DateTime::createFromFormat('Y-m-d', $data['startDate']);
        if (!$start_date || $start_date->format('Y-m-d') !== $data['startDate']) {
            $errors[] = 'Invalid start date format';
        }
    }
    
    return $errors;
}

// Function to generate unique reference
function generateReference() {
    return 'REG-' . date('Y') . '-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
}

// Function to send email notification
function sendEmailNotification($registration) {
    global $admin_email;
    
    $subject = "New Registration - MIRACLE ECD";
    $message = "
    <html>
    <head>
        <title>New Registration</title>
    </head>
    <body>
        <h2>New Registration Received</h2>
        <p><strong>Registration ID:</strong> {$registration['id']}</p>
        <p><strong>Parent/Guardian:</strong> {$registration['parent_name']}</p>
        <p><strong>Email:</strong> {$registration['email']}</p>
        <p><strong>Phone:</strong> {$registration['phone']}</p>
        <p><strong>Child's Name:</strong> {$registration['child_name']}</p>
        <p><strong>Child's Age:</strong> {$registration['child_age']} years</p>
        <p><strong>Program:</strong> {$registration['program']}</p>
        <p><strong>Start Date:</strong> {$registration['start_date']}</p>
        <p><strong>Message:</strong> {$registration['message']}</p>
        <p><strong>Registration Date:</strong> {$registration['registration_date']}</p>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: MIRACLE ECD <noreply@miracleecd.com>" . "\r\n";
    
    return mail($admin_email, $subject, $message, $headers);
}

// Function to create notification
function createNotification($pdo, $type, $title, $message, $data = null) {
    $stmt = $pdo->prepare("
        INSERT INTO notifications (type, title, message, data) 
        VALUES (?, ?, ?, ?)
    ");
    return $stmt->execute([$type, $title, $message, $data ? json_encode($data) : null]);
}

// Handle registration submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Invalid JSON input');
        }
        
        // Validate input
        $errors = validateRegistration($input);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => $errors]);
            exit();
        }
        
        // Create database connection
        $pdo = createConnection();
        if (!$pdo) {
            // Try to create database
            if (!createDatabase()) {
                throw new Exception('Database connection failed');
            }
            $pdo = createConnection();
            if (!$pdo) {
                throw new Exception('Database connection failed after creation');
            }
        }
        
        // Prepare registration data
        $registration_data = [
            'parent_name' => $input['parentName'] ?? 'Not provided',
            'email' => $input['email'],
            'phone' => $input['phone'],
            'child_name' => $input['childName'] ?? 'Not provided',
            'child_age' => intval($input['childAge']),
            'program' => $input['program'],
            'start_date' => $input['startDate'],
            'message' => $input['message'] ?? '',
            'payment_reference' => generateReference()
        ];
        
        // Insert registration
        $stmt = $pdo->prepare("
            INSERT INTO registrations (
                parent_name, email, phone, child_name, child_age, 
                program, start_date, message, payment_reference
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $registration_data['parent_name'],
            $registration_data['email'],
            $registration_data['phone'],
            $registration_data['child_name'],
            $registration_data['child_age'],
            $registration_data['program'],
            $registration_data['start_date'],
            $registration_data['message'],
            $registration_data['payment_reference']
        ]);
        
        $registration_id = $pdo->lastInsertId();
        
        // Get the complete registration data
        $stmt = $pdo->prepare("SELECT * FROM registrations WHERE id = ?");
        $stmt->execute([$registration_id]);
        $registration = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Send email notification
        sendEmailNotification($registration);
        
        // Create admin notification
        createNotification(
            $pdo,
            'new_registration',
            'New Registration Received',
            "Registration #{$registration_id} from {$registration['parent_name']}",
            $registration
        );
        
        // Prepare response
        $response = [
            'success' => true,
            'message' => 'Registration submitted successfully!',
            'registration' => [
                'id' => $registration_id,
                'reference' => $registration_data['payment_reference'],
                'parentName' => $registration_data['parent_name'],
                'email' => $registration_data['email'],
                'phone' => $registration_data['phone'],
                'childName' => $registration_data['child_name'],
                'childAge' => $registration_data['child_age'],
                'program' => $registration_data['program'],
                'startDate' => $registration_data['start_date'],
                'message' => $registration_data['message'],
                'paymentStatus' => 'pending',
                'status' => 'pending',
                'registrationDate' => $registration['registration_date']
            ]
        ];
        
        echo json_encode($response);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ]);
    }
}

// Handle GET requests for retrieving registrations
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = createConnection();
        if (!$pdo) {
            throw new Exception('Database connection failed');
        }
        
        $action = $_GET['action'] ?? 'list';
        
        switch ($action) {
            case 'list':
                // Get all registrations
                $stmt = $pdo->query("
                    SELECT r.*, p.amount, p.payment_method, p.payment_date, p.reference as payment_reference
                    FROM registrations r
                    LEFT JOIN payments p ON r.id = p.registration_id
                    ORDER BY r.registration_date DESC
                ");
                $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'registrations' => $registrations]);
                break;
                
            case 'get':
                // Get specific registration
                $id = $_GET['id'] ?? null;
                if (!$id) {
                    throw new Exception('Registration ID required');
                }
                
                $stmt = $pdo->prepare("
                    SELECT r.*, p.amount, p.payment_method, p.payment_date, p.reference as payment_reference
                    FROM registrations r
                    LEFT JOIN payments p ON r.id = p.registration_id
                    WHERE r.id = ?
                ");
                $stmt->execute([$id]);
                $registration = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$registration) {
                    throw new Exception('Registration not found');
                }
                
                echo json_encode(['success' => true, 'registration' => $registration]);
                break;
                
            case 'notifications':
                // Get unread notifications
                $stmt = $pdo->query("
                    SELECT * FROM notifications 
                    WHERE is_read = FALSE 
                    ORDER BY created_at DESC
                ");
                $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'notifications' => $notifications]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ]);
    }
}

// Handle PUT requests for updating registrations
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            throw new Exception('Registration ID required');
        }
        
        $pdo = createConnection();
        if (!$pdo) {
            throw new Exception('Database connection failed');
        }
        
        $id = $input['id'];
        $updates = [];
        $params = [];
        
        // Allow updating specific fields
        $allowed_fields = ['registration_status', 'payment_status', 'payment_reference'];
        foreach ($allowed_fields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (empty($updates)) {
            throw new Exception('No valid fields to update');
        }
        
        $params[] = $id;
        $sql = "UPDATE registrations SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => 'Registration updated successfully']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ]);
    }
}

// Handle DELETE requests
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            throw new Exception('Registration ID required');
        }
        
        $pdo = createConnection();
        if (!$pdo) {
            throw new Exception('Database connection failed');
        }
        
        $id = $input['id'];
        
        // Delete related payments first
        $stmt = $pdo->prepare("DELETE FROM payments WHERE registration_id = ?");
        $stmt->execute([$id]);
        
        // Delete registration
        $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Registration deleted successfully']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage()
        ]);
    }
}
?> 