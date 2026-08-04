<?php
session_start();
require_once('../config.php');
require_once('../db.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/public/login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_POST['user_id'];

    try {
        // Optional: delete from related tables if needed
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        header('Location: ' . BASE_URL . '/admin/users.php?deleted=1');
        exit;
    } catch (PDOException $e) {
        error_log("Admin delete error: " . $e->getMessage());
        header('Location: ' . BASE_URL . '/admin/users.php?error=delete_failed');
        exit;
    }
}
