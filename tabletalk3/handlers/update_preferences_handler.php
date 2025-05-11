<?php
session_start();
require_once '../db.php';
require_once '../config.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: /public/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$match_id = $_POST['match_id'] ?? null;

if (!$match_id) {
    die("Invalid match selection.");
}

// Prevent duplicates
$stmt = $conn->prepare("DELETE FROM match_users WHERE user_id = ?");
$stmt->execute([$user_id]);

// Add user to selected match
$stmt = $conn->prepare("INSERT INTO match_users (match_id, user_id) VALUES (?, ?)");
$stmt->execute([$match_id, $user_id]);

header('Location: ../public/dashboard.php');
exit;
?>
