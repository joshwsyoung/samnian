<?php
// Database config
$host = '127.0.0.1';//'sql302.infinityfree.com';
$db   = 'tabletalk';//if0_37091938_tabletalk';
$user = 'root'; //'if0_37091938';
$pass = ''; //'7yX3IBB4a3HJG';

// PDO options for better error handling and UTF-8 support
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Return rows as associative arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Use native prepared statements
];

try {
    $conn = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, $options);
} catch (PDOException $e) {
    // Log the error to a file (optional but recommended in production)
    error_log("Database connection failed: " . $e->getMessage());
    die("Database connection error. Please try again later.");
}
?>
