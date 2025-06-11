<?php
// Database configuration for Orca Equipment Management System
// Update these values with your cPanel MySQL database credentials

define('DB_HOST', 'localhost'); // Usually 'localhost' in cPanel
define('DB_NAME', 'dynamick_orca_equipment'); // Your cPanel database name
define('DB_USER', 'dynamick_orca_admin'); // Your MySQL username from cPanel
define('DB_PASS', 'Mddkdsds1'); // Your MySQL password from cPanel
define('DB_CHARSET', 'utf8mb4');

// Application settings
define('UPLOAD_DIR', 'imagens/');
define('MAX_FILE_SIZE', 2 * 1024 * 1024); // 2MB
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Security settings
define('ADMIN_PASSWORD', 'orca2024'); // Change this to your desired password

// Error reporting (set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Function to get database connection
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
        }
    }
    
    return $pdo;
}

// Function to validate file upload
function validateFile($file) {
    $errors = [];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors[] = 'Upload error occurred';
        return $errors;
    }
    
    if ($file['size'] > MAX_FILE_SIZE) {
        $errors[] = 'File size exceeds 2MB limit';
        return $errors;
    }
    
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXTENSIONS)) {
        $errors[] = 'Invalid file type. Allowed: ' . implode(', ', ALLOWED_EXTENSIONS);
        return $errors;
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mimeType, $allowedMimes)) {
        $errors[] = 'Invalid file type detected';
        return $errors;
    }
    
    return $errors;
}

// Function to sanitize filename
function sanitizeFilename($filename) {
    // Remove any path information
    $filename = basename($filename);
    
    // Replace unsafe characters
    $filename = preg_replace('/[^a-zA-Z0-9\._-]/', '', $filename);
    
    // Ensure it's not empty
    if (empty($filename)) {
        $filename = 'upload_' . time();
    }
    
    return $filename;
}

// Function to handle CORS for API requests
function handleCORS() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400'); // cache for 1 day
    }

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        
        exit(0);
    }
}

// Function to send JSON response
function sendJSON($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?> 