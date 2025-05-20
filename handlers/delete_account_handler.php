<?php
session_start();
require_once('../config.php');
require_once('../db.php');


if (!isset($_SESSION['user_id'])) {
    $_SESSION['error'] = 'Unauthorized access.';
    header('Location: ../public/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // Delete all related records first (match_users, availability, etc. if you want)
    $conn->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
    session_destroy();
    header('Location: ../public/index.php');
    exit;
} catch (Exception $e) {
    $_SESSION['error'] = 'Failed to delete account.';
    header('Location: ../public/dashboard.php');
    exit;
}
