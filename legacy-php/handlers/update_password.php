<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
session_start();

$token = $_POST['token'] ?? '';
$newPassword = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

// Validate input
if (!$token || !$newPassword || !$confirmPassword) {
    header('Location: ' . BASE_URL . '/public/reset_password.php?token=' . urlencode($token) . '&error=missing');
    exit;
}

// Check if passwords match
if ($newPassword !== $confirmPassword) {
    header('Location: ' . BASE_URL . '/public/reset_password.php?token=' . urlencode($token) . '&error=nomatch');
    exit;
}

// Check if the token exists and is not expired
$stmt = $conn->prepare("SELECT * FROM password_reset_codes WHERE token = ? AND expires_at > NOW()");
$stmt->execute([$token]);
$resetRecord = $stmt->fetch();

if (!$resetRecord) {
    header('Location: ' . BASE_URL . '/public/reset_password.php?token=' . urlencode($token) . '&error=invalid_or_expired');
    exit;
}

$email = $resetRecord['email'];

// Hash the new password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Update the user's password
$stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
$stmt->execute([$hashedPassword, $email]);

// Delete the token
$stmt = $conn->prepare("DELETE FROM password_reset_codes WHERE token = ?");
$stmt->execute([$token]);

// Redirect to login with success
header('Location: ' . BASE_URL . '/public/login.php?success=password_reset');
exit;
