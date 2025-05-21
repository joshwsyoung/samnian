<?php
session_start();
require_once('../config.php');
require_once('../db.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/admin/login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id          = $_POST['id'];
    $event_date  = $_POST['event_date'];
    $slot        = $_POST['slot'];
    $price_point = $_POST['price_point'];
    $approved    = isset($_POST['approved']) ? 1 : 0;

    try {
        $stmt = $conn->prepare("UPDATE matches SET event_date = ?, slot = ?, price_point = ?, approved = ? WHERE id = ?");
        $stmt->execute([$event_date, $slot, $price_point, $approved, $id]);

        header('Location: ' . BASE_URL . '/admin/matches.php?success=match_updated');
        exit;
    } catch (PDOException $e) {
        error_log('Match update failed: ' . $e->getMessage());
        header('Location: ' . BASE_URL . '/admin/matches.php?error=update_failed');
        exit;
    }
}
