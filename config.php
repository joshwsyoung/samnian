<?php
// Load DB connection settings and $conn object
require_once __DIR__ . '/db.php';

// API Keys and global constants (still define here when ready)
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

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Session info - Debugging session status
if (!function_exists('session_info')) {
    function session_info() {
        if (isset($_SESSION['user_id'])) {
            $status = 'Logged in';
            $user_id = $_SESSION['user_id'];
            $user_name = $_SESSION['user_name'] ?? 'N/A';
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
    if (APP_DEBUG) {
        define('BASE_URL', 'http://localhost/talktable4');
    } else {
        define('BASE_URL', 'https://dev.queensgatecreative.com/tabletalk3');
    }
}

