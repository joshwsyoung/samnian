<?php
session_start();
require_once('../db.php');
require_once('../config.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/admin/login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $event_date  = $_POST['event_date'];
    $slot        = $_POST['slot'];
    $price_point = $_POST['price_point'];

    try {
        $stmt = $conn->prepare("INSERT INTO matches (event_date, slot, price_point) VALUES (?, ?, ?)");
        $stmt->execute([$event_date, $slot, $price_point]);

        header('Location: ' . BASE_URL . '/admin/matches.php?success=created');
        exit;
    } catch (PDOException $e) {
        error_log('Match creation failed: ' . $e->getMessage());
        header('Location: ' . BASE_URL . '/admin/create_match.php?error=failed');
        exit;
    }
}
