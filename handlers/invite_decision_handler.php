<?php
require_once '../db.php';
require_once '../config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: " . BASE_URL . "/public/login.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conversation_id = $_POST['conversation_id'] ?? null;
    $decision = $_POST['decision'] ?? null;

    if ($conversation_id === null || !in_array($decision, ['accepted', 'declined'])) {
        header("Location: " . BASE_URL . "/public/messages.php?error=missing_data");
        exit;
    }

    $user_id = $_SESSION['user_id'];

    // Check if the user has been invited to the conversation
    $stmt = $conn->prepare("SELECT * FROM conversation_users WHERE conversation_id = ? AND user_id = ? AND status = 'pending'");
    $stmt->execute([$conversation_id, $user_id]);
    $invitation = $stmt->fetch();

    if (!$invitation) {
        header("Location: " . BASE_URL . "/public/messages.php?error=no_pending_invitation");
        exit;
    }

    // Update the status based on the user's decision
    $stmt2 = $conn->prepare("UPDATE conversation_users SET status = ? WHERE conversation_id = ? AND user_id = ?");
    $stmt2->execute([$decision, $conversation_id, $user_id]);

    // Redirect back to the conversation page
    header("Location: " . BASE_URL . "/public/messages.php?conversation_id=" . $conversation_id);
    exit;
}

header("Location: " . BASE_URL . "/public/messages.php");
exit;
