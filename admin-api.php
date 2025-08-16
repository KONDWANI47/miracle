<?php
require_once 'config.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple authentication (in production, use proper JWT or session-based auth)
function authenticateAdmin() {
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // Check for Bearer token
    if (strpos($auth_header, 'Bearer ') === 0) {
        $token = substr($auth_header, 7);
        
        // In a real application, validate the token against a database or JWT
        // For demo purposes, we'll accept any non-empty token
        if (!empty($token)) {
            return true;
        }
    }
    
    // If no valid token, check for admin credentials in the database
    if (isset($_POST['email']) && isset($_POST['password'])) {
        $email = $_POST['email'];
        $password = $_POST['password'];
        
        try {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE email = ? AND is_active = 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password_hash'])) {
                // Update last login
                $updateStmt = $pdo->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?");
                $updateStmt->execute([$user['id']]);
                
                return true;
            }
        } catch (Exception $e) {
            // Fallback to default admin credentials for demo
            if ($email === 'admin@miracleecd.com' && $password === 'admin123') {
                return true;
            }
        }
    }
    
    // If we reach here, authentication failed
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit();
}

// Get database connection
function getConnection() {
    try {
        return getDBConnection();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
        exit();
    }
}

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'dashboard';
    
    switch ($action) {
        case 'verify_token':
            authenticateAdmin();
            echo json_encode(['success' => true]);
            break;
            
        case 'get_registrations':
            authenticateAdmin();
            
            try {
                $pdo = getConnection();
                $stmt = $pdo->query("SELECT * FROM registrations ORDER BY registration_date DESC");
                $registrations = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'registrations' => $registrations]);
            } catch (Exception $e) {
                // If database fails, try to get from localStorage via JavaScript
                echo json_encode(['success' => false, 'error' => 'Failed to get registrations from database']);
            }
            break;
            
        case 'get_registration':
            authenticateAdmin();
            
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Registration ID required']);
                break;
            }
            
            $id = $_GET['id'];
            
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("SELECT * FROM registrations WHERE id = ?");
                $stmt->execute([$id]);
                $registration = $stmt->fetch();
                
                if ($registration) {
                    echo json_encode(['success' => true, 'registration' => $registration]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Registration not found']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to get registration']);
            }
            break;
            
        case 'get_payments':
            authenticateAdmin();
            
            try {
                $pdo = getConnection();
                $stmt = $pdo->query("SELECT * FROM payments ORDER BY payment_date DESC");
                $payments = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'payments' => $payments]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to get payments']);
            }
            break;
            
        case 'get_analytics':
            authenticateAdmin();
            
            try {
                $pdo = getConnection();
                
                // Get total registrations
                $totalStmt = $pdo->query("SELECT COUNT(*) as total FROM registrations");
                $total = $totalStmt->fetch()['total'];
                
                // Get registrations by program
                $programStmt = $pdo->query("SELECT program, COUNT(*) as count FROM registrations GROUP BY program");
                $programCounts = $programStmt->fetchAll();
                
                // Get registrations by status
                $statusStmt = $pdo->query("SELECT status, COUNT(*) as count FROM registrations GROUP BY status");
                $statusCounts = $statusStmt->fetchAll();
                
                // Get total revenue
                $revenueStmt = $pdo->query("SELECT SUM(amount) as total FROM payments WHERE status = 'Completed'");
                $revenue = $revenueStmt->fetch()['total'] ?? 0;
                
                echo json_encode([
                    'success' => true,
                    'analytics' => [
                        'total_registrations' => $total,
                        'program_counts' => $programCounts,
                        'status_counts' => $statusCounts,
                        'total_revenue' => $revenue
                    ]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to get analytics']);
            }
            break;
            
        case 'dashboard':
        default:
            authenticateAdmin();
            
            try {
                $pdo = getConnection();
                
                // Get recent registrations
                $recentStmt = $pdo->query("SELECT * FROM registrations ORDER BY registration_date DESC LIMIT 5");
                $recentRegistrations = $recentStmt->fetchAll();
                
                // Get recent payments
                $paymentsStmt = $pdo->query("SELECT * FROM payments ORDER BY payment_date DESC LIMIT 5");
                $recentPayments = $paymentsStmt->fetchAll();
                
                // Get counts
                $countsStmt = $pdo->query("
                    SELECT
                        (SELECT COUNT(*) FROM registrations) as total_registrations,
                        (SELECT COUNT(*) FROM registrations WHERE status = 'Pending') as pending_registrations,
                        (SELECT COUNT(*) FROM registrations WHERE status = 'Payment Required') as payment_required,
                        (SELECT COUNT(*) FROM registrations WHERE status = 'Paid') as paid_registrations,
                        (SELECT SUM(amount) FROM payments WHERE status = 'Completed') as total_revenue
                ");
                $counts = $countsStmt->fetch();
                
                echo json_encode([
                    'success' => true,
                    'dashboard' => [
                        'recent_registrations' => $recentRegistrations,
                        'recent_payments' => $recentPayments,
                        'counts' => $counts
                    ]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to get dashboard data']);
            }
            break;
    }
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'login':
            // Handle login
            if (!isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Email and password required']);
                break;
            }
            
            $email = $data['email'];
            $password = $data['password'];
            
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE email = ? AND is_active = 1");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                
                if ($user && password_verify($password, $user['password_hash'])) {
                    // Update last login
                    $updateStmt = $pdo->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?");
                    $updateStmt->execute([$user['id']]);
                    
                    // Generate token (in production, use JWT)
                    $token = bin2hex(random_bytes(32));
                    
                    echo json_encode([
                        'success' => true,
                        'user' => [
                            'id' => $user['id'],
                            'email' => $user['email'],
                            'name' => $user['full_name'],
                            'role' => $user['role']
                        ],
                        'token' => $token
                    ]);
                } else {
                    // Fallback to default admin for demo
                    if ($email === 'admin@miracleecd.com' && $password === 'admin123') {
                        $token = bin2hex(random_bytes(32));
                        
                        echo json_encode([
                            'success' => true,
                            'user' => [
                                'id' => 1,
                                'email' => 'admin@miracleecd.com',
                                'name' => 'Admin User',
                                'role' => 'admin'
                            ],
                            'token' => $token
                        ]);
                        break;
                    }
                    
                    http_response_code(401);
                    echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
                }
            } catch (Exception $e) {
                // Fallback to default admin for demo if database fails
                if ($email === 'admin@miracleecd.com' && $password === 'admin123') {
                    $token = bin2hex(random_bytes(32));
                    
                    echo json_encode([
                        'success' => true,
                        'user' => [
                            'id' => 1,
                            'email' => 'admin@miracleecd.com',
                            'name' => 'Admin User',
                            'role' => 'admin'
                        ],
                        'token' => $token
                    ]);
                    break;
                }
                
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Login failed: ' . $e->getMessage()]);
            }
            break;
            
        case 'create_registration':
            authenticateAdmin();
            
            if (!isset($data['parent_name']) || !isset($data['email']) || !isset($data['child_name'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Required fields missing']);
                break;
            }
            
            try {
                $pdo = getConnection();
                
                $stmt = $pdo->prepare("
                    INSERT INTO registrations (
                        parent_name, email, phone, address, child_name, child_age, 
                        start_date, program, message, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $data['parent_name'],
                    $data['email'],
                    $data['phone'] ?? '',
                    $data['address'] ?? '',
                    $data['child_name'],
                    $data['child_age'] ?? 0,
                    $data['start_date'] ?? date('Y-m-d'),
                    $data['program'] ?? 'Early Childhood Care',
                    $data['message'] ?? '',
                    $data['status'] ?? 'Pending'
                ]);
                
                $id = $pdo->lastInsertId();
                
                echo json_encode(['success' => true, 'id' => $id]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to create registration: ' . $e->getMessage()]);
            }
            break;
            
        case 'update_registration':
            authenticateAdmin();
            
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Registration ID required']);
                break;
            }
            
            try {
                $pdo = getConnection();
                
                // Build update query dynamically
                $updateFields = [];
                $params = [];
                
                foreach ($data as $key => $value) {
                    if ($key !== 'id') {
                        $updateFields[] = "$key = ?";
                        $params[] = $value;
                    }
                }
                
                // Add ID as last parameter
                $params[] = $data['id'];
                
                $stmt = $pdo->prepare("
                    UPDATE registrations 
                    SET " . implode(', ', $updateFields) . ", last_updated = NOW()
                    WHERE id = ?
                ");
                
                $stmt->execute($params);
                
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update registration: ' . $e->getMessage()]);
            }
            break;
            
        case 'delete_registration':
            authenticateAdmin();
            
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Registration ID required']);
                break;
            }
            
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = ?");
                $stmt->execute([$data['id']]);
                
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to delete registration: ' . $e->getMessage()]);
            }
            break;
            
        case 'create_payment':
            authenticateAdmin();
            
            if (!isset($data['registration_id']) || !isset($data['amount'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Required fields missing']);
                break;
            }
            
            try {
                $pdo = getConnection();
                
                // Get parent name from registration
                $regStmt = $pdo->prepare("SELECT parent_name FROM registrations WHERE id = ?");
                $regStmt->execute([$data['registration_id']]);
                $registration = $regStmt->fetch();
                
                if (!$registration) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Registration not found']);
                    break;
                }
                
                // Insert payment
                $stmt = $pdo->prepare("
                    INSERT INTO payments (
                        registration_id, parent_name, amount, currency, 
                        payment_method, status, transaction_reference
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $data['registration_id'],
                    $registration['parent_name'],
                    $data['amount'],
                    $data['currency'] ?? 'MWK',
                    $data['payment_method'] ?? 'Card',
                    $data['status'] ?? 'Completed',
                    $data['transaction_reference'] ?? generateReference('PAY')
                ]);
                
                $paymentId = $pdo->lastInsertId();
                
                // Update registration status
                $updateStmt = $pdo->prepare("
                    UPDATE registrations 
                    SET status = 'Paid', payment_status = 'Completed', payment_id = ?, last_updated = NOW()
                    WHERE id = ?
                ");
                
                $updateStmt->execute([$paymentId, $data['registration_id']]);
                
                echo json_encode(['success' => true, 'id' => $paymentId]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to create payment: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }
}

// Handle PUT requests
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    authenticateAdmin();
    
    // Get JSON data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'update_registration_status':
            if (!isset($data['id']) || !isset($data['status'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID and status required']);
                break;
            }
            
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("UPDATE registrations SET status = ?, last_updated = NOW() WHERE id = ?");
                $stmt->execute([$data['status'], $data['id']]);
                
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update status: ' . $e->getMessage()]);
            }
            break;
            
        case 'update_payment_status':
            if (!isset($data['id']) || !isset($data['status'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID and status required']);
                break;
            }
            
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("UPDATE payments SET status = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$data['status'], $data['id']]);
                
                // If payment is completed, update registration status
                if ($data['status'] === 'Completed') {
                    $updateStmt = $pdo->prepare("
                        UPDATE registrations 
                        SET status = 'Paid', payment_status = 'Completed', last_updated = NOW()
                        WHERE id = (SELECT registration_id FROM payments WHERE id = ?)
                    ");
                    
                    $updateStmt->execute([$data['id']]);
                }
                
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to update payment status: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }
}

// Handle DELETE requests
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    authenticateAdmin();
    
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID required']);
        exit();
    }
    
    switch ($action) {
        case 'delete_registration':
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to delete registration: ' . $e->getMessage()]);
            }
            break;
            
        case 'delete_payment':
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("DELETE FROM payments WHERE id = ?");
                $stmt->execute([$id]);
                
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to delete payment: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }
}
?>