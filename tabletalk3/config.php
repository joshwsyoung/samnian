<?php
// API Keys and global constants
// define('VONAGE_API_KEY', 'your-key-here');
// define('VONAGE_API_SECRET', 'your-secret-here');

// Error Debug Toggle — switch this during development/production
if (!defined('APP_DEBUG')) {
    define('APP_DEBUG', true);
}

if (APP_DEBUG) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// Start the session only if it's not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database connection configuration - check if already defined
if (!defined('DB_HOST')) {
    define('DB_HOST', 'sql302.infinityfree.com');
}
if (!defined('DB_NAME')) {
    define('DB_NAME', 'if0_37091938_tabletalk');
}
if (!defined('DB_USER')) {
    define('DB_USER', 'if0_37091938');
}
if (!defined('DB_PASS')) {
    define('DB_PASS', '7yX3IBB4a3HJG');
}

// PDO options for better error handling and UTF-8 support
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Return rows as associative arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Use native prepared statements
];

// Database connection
try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // Log the error to a file (optional but recommended in production)
    error_log("Database connection failed: " . $e->getMessage());
    die("Database connection error. Please try again later.");
}

// Session info - Debugging session status
if (!function_exists('session_info')) {
    function session_info() {
        if (isset($_SESSION['user_id'])) {
            $status = 'Logged in';
            $user_id = $_SESSION['user_id'];
            $user_name = $_SESSION['user_name']; // Assuming user_name is stored in session
            $is_admin = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1 ? 'Yes' : 'No';
        } else {
            $status = 'Logged out';
            $user_id = 'N/A';
            $user_name = 'N/A';
            $is_admin = 'No';
        }

        return [
            'status' => $status,
            'user_id' => $user_id,
            'user_name' => $user_name,
            'is_admin' => $is_admin
        ];
    }
}

// Define BASE_URL only if not already defined
if (!defined('BASE_URL')) {
    define('BASE_URL', 'https://dev.queensgatecreative.com/tabletalk3');
}
