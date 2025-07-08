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
    $auth_header = $headers['Authorization'] ?? '';
    
    // For demo purposes, accept any Authorization header
    // In production, validate against stored credentials
    if (empty($auth_header)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authentication required']);
        exit();
    }
    
    return true;
}

// Get database connection
function getConnection() {
    try {
        return getDBConnection();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed']);
        exit();
    }
}

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    authenticateAdmin();
    
    try {
        $pdo = getConnection();
        $action = $_GET['action'] ?? 'dashboard';
        
        switch ($action) {
            case 'dashboard':
                // Get dashboard statistics
                $stats = [];
                
                // Total registrations
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM registrations");
                $stats['total_registrations'] = $stmt->fetch()['total'];
                
                // Pending registrations
                $stmt = $pdo->query("SELECT COUNT(*) as pending FROM registrations WHERE registration_status = 'pending'");
                $stats['pending_registrations'] = $stmt->fetch()['pending'];
                
                // Paid registrations
                $stmt = $pdo->query("SELECT COUNT(*) as paid FROM registrations WHERE payment_status = 'paid'");
                $stats['paid_registrations'] = $stmt->fetch()['paid'];
                
                // Total payments
                $stmt = $pdo->query("SELECT COUNT(*) as total_payments FROM payments");
                $stats['total_payments'] = $stmt->fetch()['total_payments'];
                
                // Total revenue
                $stmt = $pdo->query("SELECT SUM(amount) as total_revenue FROM payments WHERE status = 'completed'");
                $stats['total_revenue'] = $stmt->fetch()['total_revenue'] ?? 0;
                
                // Recent registrations
                $stmt = $pdo->query("
                    SELECT * FROM registrations 
                    ORDER BY registration_date DESC 
                    LIMIT 10
                ");
                $stats['recent_registrations'] = $stmt->fetchAll();
                
                // Unread notifications
                $stmt = $pdo->query("
                    SELECT COUNT(*) as unread FROM notifications 
                    WHERE is_read = FALSE
                ");
                $stats['unread_notifications'] = $stmt->fetch()['unread'];
                
                echo json_encode(['success' => true, 'stats' => $stats]);
                break;
                
            case 'registrations':
                // Get all registrations with pagination
                $page = intval($_GET['page'] ?? 1);
                $limit = intval($_GET['limit'] ?? 20);
                $offset = ($page - 1) * $limit;
                
                $search = $_GET['search'] ?? '';
                $status = $_GET['status'] ?? '';
                $payment_status = $_GET['payment_status'] ?? '';
                
                $where_conditions = [];
                $params = [];
                
                if ($search) {
                    $where_conditions[] = "(parent_name LIKE ? OR email LIKE ? OR phone LIKE ? OR child_name LIKE ?)";
                    $search_param = "%$search%";
                    $params = array_merge($params, [$search_param, $search_param, $search_param, $search_param]);
                }
                
                if ($status) {
                    $where_conditions[] = "registration_status = ?";
                    $params[] = $status;
                }
                
                if ($payment_status) {
                    $where_conditions[] = "payment_status = ?";
                    $params[] = $payment_status;
                }
                
                $where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
                
                // Get total count
                $count_sql = "SELECT COUNT(*) as total FROM registrations $where_clause";
                $stmt = $pdo->prepare($count_sql);
                $stmt->execute($params);
                $total = $stmt->fetch()['total'];
                
                // Get registrations
                $sql = "
                    SELECT r.*, p.amount, p.payment_method, p.payment_date, p.reference as payment_reference
                    FROM registrations r
                    LEFT JOIN payments p ON r.id = p.registration_id
                    $where_clause
                    ORDER BY r.registration_date DESC
                    LIMIT ? OFFSET ?
                ";
                
                $params[] = $limit;
                $params[] = $offset;
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $registrations = $stmt->fetchAll();
                
                echo json_encode([
                    'success' => true,
                    'registrations' => $registrations,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
                break;
                
            case 'registration':
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
                $registration = $stmt->fetch();
                
                if (!$registration) {
                    throw new Exception('Registration not found');
                }
                
                echo json_encode(['success' => true, 'registration' => $registration]);
                break;
                
            case 'payments':
                // Get all payments
                $stmt = $pdo->query("
                    SELECT p.*, r.parent_name, r.child_name, r.program
                    FROM payments p
                    LEFT JOIN registrations r ON p.registration_id = r.id
                    ORDER BY p.payment_date DESC
                ");
                $payments = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'payments' => $payments]);
                break;
                
            case 'notifications':
                // Get notifications
                $unread_only = $_GET['unread'] ?? false;
                
                $sql = "SELECT * FROM notifications";
                if ($unread_only) {
                    $sql .= " WHERE is_read = FALSE";
                }
                $sql .= " ORDER BY created_at DESC";
                
                $stmt = $pdo->query($sql);
                $notifications = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'notifications' => $notifications]);
                break;
                
            case 'analytics':
                // Get analytics data
                $analytics = [];
                
                // Registration trends (last 30 days)
                $stmt = $pdo->query("
                    SELECT DATE(registration_date) as date, COUNT(*) as count
                    FROM registrations
                    WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY DATE(registration_date)
                    ORDER BY date
                ");
                $analytics['registration_trends'] = $stmt->fetchAll();
                
                // Program distribution
                $stmt = $pdo->query("
                    SELECT program, COUNT(*) as count
                    FROM registrations
                    GROUP BY program
                ");
                $analytics['program_distribution'] = $stmt->fetchAll();
                
                // Age distribution
                $stmt = $pdo->query("
                    SELECT 
                        CASE 
                            WHEN child_age < 3 THEN '0-2 years'
                            WHEN child_age < 5 THEN '3-4 years'
                            WHEN child_age < 7 THEN '5-6 years'
                            ELSE '7+ years'
                        END as age_group,
                        COUNT(*) as count
                    FROM registrations
                    GROUP BY age_group
                ");
                $analytics['age_distribution'] = $stmt->fetchAll();
                
                // Payment status distribution
                $stmt = $pdo->query("
                    SELECT payment_status, COUNT(*) as count
                    FROM registrations
                    GROUP BY payment_status
                ");
                $analytics['payment_status_distribution'] = $stmt->fetchAll();
                
                echo json_encode(['success' => true, 'analytics' => $analytics]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    authenticateAdmin();
    
    try {
        $pdo = getConnection();
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $_POST['action'] ?? $input['action'] ?? '';
        
        switch ($action) {
            case 'update_registration':
                $id = $input['id'] ?? null;
                if (!$id) {
                    throw new Exception('Registration ID required');
                }
                
                $allowed_fields = ['registration_status', 'payment_status', 'payment_reference'];
                $updates = [];
                $params = [];
                
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
                
                // Log the update
                logActivity("Registration #$id updated by admin", 'admin');
                
                echo json_encode(['success' => true, 'message' => 'Registration updated successfully']);
                break;
                
            case 'add_payment':
                $registration_id = $input['registration_id'] ?? null;
                $amount = $input['amount'] ?? null;
                $payment_method = $input['payment_method'] ?? null;
                $reference = $input['reference'] ?? generateReference('PAY');
                
                if (!$registration_id || !$amount || !$payment_method) {
                    throw new Exception('Missing required payment information');
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO payments (registration_id, parent_name, amount, payment_method, reference, status)
                    SELECT ?, parent_name, ?, ?, ?, 'completed'
                    FROM registrations WHERE id = ?
                ");
                $stmt->execute([$registration_id, $amount, $payment_method, $reference, $registration_id]);
                
                // Update registration payment status
                $stmt = $pdo->prepare("
                    UPDATE registrations 
                    SET payment_status = 'paid', payment_reference = ?
                    WHERE id = ?
                ");
                $stmt->execute([$reference, $registration_id]);
                
                logActivity("Payment added for registration #$registration_id", 'admin');
                
                echo json_encode(['success' => true, 'message' => 'Payment added successfully']);
                break;
                
            case 'mark_notification_read':
                $notification_id = $input['notification_id'] ?? null;
                if (!$notification_id) {
                    throw new Exception('Notification ID required');
                }
                
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ?");
                $stmt->execute([$notification_id]);
                
                echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
                break;
                
            case 'export_registrations':
                $format = $input['format'] ?? 'json';
                $filters = $input['filters'] ?? [];
                
                $where_conditions = [];
                $params = [];
                
                if (!empty($filters['date_from'])) {
                    $where_conditions[] = "registration_date >= ?";
                    $params[] = $filters['date_from'];
                }
                
                if (!empty($filters['date_to'])) {
                    $where_conditions[] = "registration_date <= ?";
                    $params[] = $filters['date_to'];
                }
                
                if (!empty($filters['status'])) {
                    $where_conditions[] = "registration_status = ?";
                    $params[] = $filters['status'];
                }
                
                $where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
                
                $stmt = $pdo->prepare("
                    SELECT r.*, p.amount, p.payment_method, p.payment_date, p.reference as payment_reference
                    FROM registrations r
                    LEFT JOIN payments p ON r.id = p.registration_id
                    $where_clause
                    ORDER BY r.registration_date DESC
                ");
                $stmt->execute($params);
                $registrations = $stmt->fetchAll();
                
                if ($format === 'csv') {
                    header('Content-Type: text/csv');
                    header('Content-Disposition: attachment; filename="registrations_' . date('Y-m-d') . '.csv"');
                    
                    $output = fopen('php://output', 'w');
                    fputcsv($output, array_keys($registrations[0] ?? []));
                    
                    foreach ($registrations as $row) {
                        fputcsv($output, $row);
                    }
                    
                    fclose($output);
                    exit();
                } else {
                    echo json_encode(['success' => true, 'registrations' => $registrations]);
                }
                break;
                
            default:
                throw new Exception('Invalid action');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// Handle PUT requests
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    authenticateAdmin();
    
    try {
        $pdo = getConnection();
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Handle bulk operations
        if (isset($input['bulk_action'])) {
            $ids = $input['ids'] ?? [];
            $action = $input['bulk_action'];
            
            if (empty($ids)) {
                throw new Exception('No registrations selected');
            }
            
            $placeholders = str_repeat('?,', count($ids) - 1) . '?';
            
            switch ($action) {
                case 'approve':
                    $stmt = $pdo->prepare("UPDATE registrations SET registration_status = 'approved' WHERE id IN ($placeholders)");
                    $stmt->execute($ids);
                    break;
                    
                case 'reject':
                    $stmt = $pdo->prepare("UPDATE registrations SET registration_status = 'rejected' WHERE id IN ($placeholders)");
                    $stmt->execute($ids);
                    break;
                    
                case 'delete':
                    // Delete related payments first
                    $stmt = $pdo->prepare("DELETE FROM payments WHERE registration_id IN ($placeholders)");
                    $stmt->execute($ids);
                    
                    // Delete registrations
                    $stmt = $pdo->prepare("DELETE FROM registrations WHERE id IN ($placeholders)");
                    $stmt->execute($ids);
                    break;
                    
                default:
                    throw new Exception('Invalid bulk action');
            }
            
            logActivity("Bulk action '$action' performed on " . count($ids) . " registrations", 'admin');
            
            echo json_encode(['success' => true, 'message' => 'Bulk action completed successfully']);
        } else {
            throw new Exception('Invalid request');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// Handle DELETE requests
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    authenticateAdmin();
    
    try {
        $pdo = getConnection();
        $input = json_decode(file_get_contents('php://input'), true);
        
        $id = $input['id'] ?? null;
        if (!$id) {
            throw new Exception('Registration ID required');
        }
        
        // Delete related payments first
        $stmt = $pdo->prepare("DELETE FROM payments WHERE registration_id = ?");
        $stmt->execute([$id]);
        
        // Delete registration
        $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = ?");
        $stmt->execute([$id]);
        
        logActivity("Registration #$id deleted by admin", 'admin');
        
        echo json_encode(['success' => true, 'message' => 'Registration deleted successfully']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?> 