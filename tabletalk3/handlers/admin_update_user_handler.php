<?php
session_start();
require_once('../config.php');
require_once('../db.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/public/login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id    = $_POST['id'];
    $name  = $_POST['name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $age   = $_POST['age'];
    $city  = $_POST['city'];
    $role  = $_POST['role'];

    try {
        $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ?, age = ?, city = ?, role = ? WHERE id = ?");
        $stmt->execute([$name, $email, $phone, $age, $city, $role, $id]);
        header('Location: ' . BASE_URL . '/admin/users.php?updated=1');
        exit;
    } catch (PDOException $e) {
        error_log("Admin update error: " . $e->getMessage());
        header('Location: ' . BASE_URL . '/admin/users.php?error=db');
        exit;
    }
}
