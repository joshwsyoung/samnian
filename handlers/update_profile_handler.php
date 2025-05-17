<?php
session_start();
include_once('../db.php');
include_once('../config.php');

if (!isset($_SESSION['user_id'])) {
    header('Location: ' . BASE_URL . '/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$age = isset($_POST['age']) ? trim($_POST['age']) : '';
$city = isset($_POST['city']) ? trim($_POST['city']) : '';

$errors = [];

if (empty($name)) $errors[] = 'Name is required.';
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid email is required.';
if (empty($phone)) $errors[] = 'Phone number is required.';
if (empty($age) || !is_numeric($age) || $age < 16 || $age > 100) $errors[] = 'Valid age is required.';
if (empty($city)) $errors[] = 'City is required.';

if (!empty($errors)) {
    $_SESSION['error'] = implode(' ', $errors);
    header('Location: ' . BASE_URL . '/public/dashboard.php');
    exit;
}

// ✅ Update all fields including email and phone
$stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ?, age = ?, city = ? WHERE id = ?");
$stmt->execute([$name, $email, $phone, $age, $city, $user_id]);

$_SESSION['success'] = 'Profile updated successfully!';
header('Location: ' . BASE_URL . '/public/dashboard.php');
exit;
?>
