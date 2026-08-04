<?php
session_start();

include_once('../config.php');
include_once('../db.php');

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . BASE_URL . '/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

// Check if event_date and slot are provided
if (isset($_POST['event_date'], $_POST['slot'])) {
    $event_date = $_POST['event_date'];
    $slot = $_POST['slot'];

    // Validate input
    if (empty($event_date) || empty($slot)) {
        $_SESSION['error'] = 'Please select a date and time slot.';
        header('Location: ' . BASE_URL . '/public/dashboard.php');
        exit;
    }

    // Insert or update availability
    $stmt = $conn->prepare("SELECT * FROM availability WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $existing_availability = $stmt->fetch();

    if ($existing_availability) {
        // Update availability
        $stmt = $conn->prepare("UPDATE availability SET event_date = ?, slot = ? WHERE user_id = ?");
        $stmt->execute([$event_date, $slot, $user_id]);
    } else {
        // Insert new availability
        $stmt = $conn->prepare("INSERT INTO availability (user_id, event_date, slot) VALUES (?, ?, ?)");
        $stmt->execute([$user_id, $event_date, $slot]);
    }

    $_SESSION['success'] = 'Availability updated successfully!';
    header('Location: ' . BASE_URL . '/public/dashboard.php');
    exit;
} else {
    $_SESSION['error'] = 'Please fill in all fields.';
    header('Location: ' . BASE_URL . '/public/dashboard.php');
    exit;
}
?>