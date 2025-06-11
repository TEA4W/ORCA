<?php
require_once 'config.php';

handleCORS();

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get the endpoint from the URL
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    switch ($endpoint) {
        case 'equipment_data':
            handleEquipmentData();
            break;
        
        case 'transportation_fees':
            handleTransportationFees();
            break;
        
        case 'payment_conditions':
            handlePaymentConditions();
            break;
        
        case 'payment_methods':
            handlePaymentMethods();
            break;
        
        case 'add_equipment':
            if ($method === 'POST') {
                handleAddEquipment();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        case 'save_equipment':
            if ($method === 'POST') {
                handleSaveEquipmentChanges();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        case 'delete_equipment':
            if ($method === 'POST') {
                handleDeleteEquipment();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        default:
            sendJSON(['error' => 'Endpoint not found'], 404);
    }
} catch (Exception $e) {
    sendJSON(['error' => $e->getMessage()], 500);
}

function handleEquipmentData() {
    $pdo = getDBConnection();
    
    $stmt = $pdo->query("SELECT name, price, description, image_url FROM equipment ORDER BY name ASC");
    $equipment = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $equipmentData = [];
    foreach ($equipment as $item) {
        $equipmentData[$item['name']] = [
            'price' => (float)$item['price'],
            'description' => $item['description'],
            'image_url' => $item['image_url']
        ];
    }
    
    sendJSON($equipmentData);
}

function handleTransportationFees() {
    $pdo = getDBConnection();
    
    $stmt = $pdo->query("SELECT location, fee FROM transportation_fees ORDER BY location ASC");
    $fees = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $feesData = [];
    foreach ($fees as $fee) {
        $feesData[$fee['location']] = (float)$fee['fee'];
    }
    
    sendJSON($feesData);
}

function handlePaymentConditions() {
    $pdo = getDBConnection();
    
    $stmt = $pdo->query("SELECT value, label, export_text, html_id, is_default FROM payment_conditions ORDER BY id ASC");
    $conditions = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $conditionsData = [];
    foreach ($conditions as $condition) {
        $conditionsData[] = [
            'value' => $condition['value'],
            'label' => $condition['label'],
            'exportText' => $condition['export_text'],
            'htmlId' => $condition['html_id'],
            'defaultChecked' => (bool)$condition['is_default']
        ];
    }
    
    sendJSON($conditionsData);
}

function handlePaymentMethods() {
    $pdo = getDBConnection();
    
    $stmt = $pdo->query("SELECT method_id, label, export_text, is_default FROM payment_methods ORDER BY id ASC");
    $methods = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $methodsData = [];
    foreach ($methods as $method) {
        $methodsData[] = [
            'id' => $method['method_id'],
            'label' => $method['label'],
            'exportText' => $method['export_text'],
            'defaultChecked' => (bool)$method['is_default']
        ];
    }
    
    sendJSON($methodsData);
}

function handleAddEquipment() {
    $pdo = getDBConnection();
    
    // Validate input
    $name = trim($_POST['name'] ?? '');
    $price = floatval($_POST['price'] ?? 0);
    $description = trim($_POST['description'] ?? '');
    $currentlyEditingName = trim($_POST['currently_editing_name'] ?? '');
    $existingImageUrl = trim($_POST['existing_image_url'] ?? '');
    
    if (empty($name) || $price <= 0) {
        sendJSON(['error' => 'Nome e preço válido são obrigatórios'], 400);
    }
    
    // Sanitize name
    $name = preg_replace('/[^\w\s.-]/', '', $name);
    
    // Handle image upload
    $imageUrl = $existingImageUrl;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadErrors = validateFile($_FILES['image']);
        if (!empty($uploadErrors)) {
            sendJSON(['error' => implode(', ', $uploadErrors)], 400);
        }
        
        $originalName = $_FILES['image']['name'];
        $sanitizedName = sanitizeFilename($originalName);
        $uploadPath = UPLOAD_DIR . $sanitizedName;
        
        // Create upload directory if it doesn't exist
        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }
        
        // Handle duplicate filenames
        $counter = 1;
        $baseName = pathinfo($sanitizedName, PATHINFO_FILENAME);
        $extension = pathinfo($sanitizedName, PATHINFO_EXTENSION);
        
        while (file_exists($uploadPath)) {
            $sanitizedName = $baseName . '_' . $counter . '.' . $extension;
            $uploadPath = UPLOAD_DIR . $sanitizedName;
            $counter++;
        }
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
            $imageUrl = $sanitizedName;
        } else {
            sendJSON(['error' => 'Failed to upload image'], 500);
        }
    }
    
    try {
        if (!empty($currentlyEditingName)) {
            // Update existing equipment
            $stmt = $pdo->prepare("UPDATE equipment SET name = ?, price = ?, description = ?, image_url = ? WHERE name = ?");
            $stmt->execute([$name, $price, $description, $imageUrl, $currentlyEditingName]);
        } else {
            // Check if equipment already exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM equipment WHERE name = ?");
            $stmt->execute([$name]);
            if ($stmt->fetchColumn() > 0) {
                sendJSON(['error' => 'Equipamento com este nome já existe'], 400);
            }
            
            // Insert new equipment
            $stmt = $pdo->prepare("INSERT INTO equipment (name, price, description, image_url) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $price, $description, $imageUrl]);
        }
        
        // Return updated equipment data
        handleEquipmentData();
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            sendJSON(['error' => 'Equipamento com este nome já existe'], 400);
        } else {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
}

function handleSaveEquipmentChanges() {
    // This function handles saving all equipment changes to the database
    // For now, we'll just return success since individual operations are handled above
    sendJSON(['success' => true, 'message' => 'Changes saved successfully']);
}

function handleDeleteEquipment() {
    $input = json_decode(file_get_contents('php://input'), true);
    $equipmentName = $input['name'] ?? '';
    
    if (empty($equipmentName)) {
        sendJSON(['error' => 'Equipment name is required'], 400);
    }
    
    try {
        $pdo = getDBConnection();
        
        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM equipment WHERE name = ?");
        $deleted = $stmt->execute([$equipmentName]);
        
        if ($deleted && $stmt->rowCount() > 0) {
            sendJSON(['success' => true, 'message' => 'Equipment deleted successfully']);
        } else {
            sendJSON(['success' => false, 'error' => 'Equipment not found or already deleted']);
        }
    } catch (PDOException $e) {
        error_log("Database error in delete_equipment: " . $e->getMessage());
        sendJSON(['error' => 'Database error occurred'], 500);
    }
}
?>