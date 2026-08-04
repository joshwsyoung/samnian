<?php
// Use APP_DEBUG from config.php to determine environment
if (!defined('APP_DEBUG')) {
    die('APP_DEBUG not defined. Make sure config.php is loaded before db.php.');
}

if (APP_DEBUG) {
    define('DB_HOST', '127.0.0.1');
    define('DB_NAME', 'tabletalk');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    define('DB_HOST', 'sql302.infinityfree.com');
    define('DB_NAME', 'if0_37091938_tabletalk');
    define('DB_USER', 'if0_37091938');
    define('DB_PASS', '7yX3IBB4a3HJG');
}

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $conn = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        $options
    );
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    die("Database connection error. Please try again later.");
}
