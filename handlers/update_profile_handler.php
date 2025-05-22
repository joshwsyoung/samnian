<?php
session_start();
include_once('../config.php');
include_once('../db.php');

if (!isset($_SESSION['user_id'])) {
    header('Location: ' . BASE_URL . '/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$age = trim($_POST['age'] ?? '');
$city = trim($_POST['city'] ?? '');
$price_point = trim($_POST['price_point'] ?? '');

$errors = [];

if (empty($name))
    $errors[] = 'Name is required.';
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL))
    $errors[] = 'Valid email is required.';
if (empty($phone))
    $errors[] = 'Phone number is required.';
if (empty($age) || !is_numeric($age) || $age < 16 || $age > 100)
    $errors[] = 'Valid age is required.';
if (empty($city))
    $errors[] = 'City is required.';
if (!in_array($price_point, ['£', '££', '£££']))
    $errors[] = 'Invalid price point selected.';

$profile_image = null;

// ✅ Handle image upload if present
if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
    $imageTmpPath = $_FILES['profile_image']['tmp_name'];
    $imageName = basename($_FILES['profile_image']['name']);
    $imageExtension = strtolower(pathinfo($imageName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $maxFileSize = 2 * 1024 * 1024; // 2MB

    if ($_FILES['profile_image']['size'] > $maxFileSize) {
        $errors[] = 'Image file size must be less than 2MB.';
    } elseif (!in_array($imageExtension, $allowedExtensions)) {
        $errors[] = 'Only JPG, PNG, GIF, or WEBP images are allowed.';
    } else {
        $newFileName = uniqid('profile_', true) . '.' . $imageExtension;
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $destPath = $uploadDir . $newFileName;

        if (move_uploaded_file($imageTmpPath, $destPath)) {
            $profile_image = $newFileName;
        } else {
            $errors[] = 'Failed to move uploaded file.';
        }
    }
}

if (!empty($errors)) {
    $_SESSION['error'] = implode(' ', $errors);
    header('Location: ' . BASE_URL . '/public/profile.php');
    exit;
}

// ✅ Update user
if ($profile_image) {
    $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ?, age = ?, city = ?, price_point = ?, profile_image = ? WHERE id = ?");
    $stmt->execute([$name, $email, $phone, $age, $city, $price_point, $profile_image, $user_id]);
} else {
    $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ?, age = ?, city = ?, price_point = ? WHERE id = ?");
    $stmt->execute([$name, $email, $phone, $age, $city, $price_point, $user_id]);
}

$_SESSION['success'] = 'Profile updated successfully!';
header('Location: ' . BASE_URL . '/public/profile.php');
exit;
