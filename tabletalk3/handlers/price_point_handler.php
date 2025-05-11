<?php
session_start();
include_once('../db.php');
include_once('../config.php');

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . BASE_URL . '/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

// Check if price_point is provided
if (isset($_POST['price_point'])) {
    $price_point = $_POST['price_point'];

    // Validate if price_point is provided and not empty
    if (empty($price_point)) {
        $_SESSION['error'] = 'Price point is required.';
        header('Location: ' . BASE_URL . '/public/dashboard.php');
        exit;
    }

    // Update the price_point in the users table for the logged-in user
    try {
        // Update the user's price_point
        $stmt = $conn->prepare("
            UPDATE users 
            SET price_point = ? 
            WHERE id = ?
        ");
        $stmt->execute([$price_point, $user_id]);

        $_SESSION['success'] = 'Price point updated successfully!';
    } catch (PDOException $e) {
        $_SESSION['error'] = 'Error updating price point: ' . $e->getMessage();
    }

    header('Location: ' . BASE_URL . '/public/dashboard.php');
    exit;
} else {
    $_SESSION['error'] = 'Price point is required.';
    header('Location: ' . BASE_URL . '/public/dashboard.php');
    exit;
}
?>
