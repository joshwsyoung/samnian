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
    $message = trim($_POST['message'] ?? '');
    $user_id = $_SESSION['user_id'];

    if ($conversation_id === null || $message === '') {
        header("Location: " . BASE_URL . "/public/messages.php?error=missing_message_or_conversation");
        exit;
    }

    // Check if the user is part of the conversation
    $stmt = $conn->prepare("SELECT * FROM conversation_users WHERE conversation_id = ? AND user_id = ?");
    $stmt->execute([$conversation_id, $user_id]);
    $conversation_user = $stmt->fetch();

    if (!$conversation_user) {
        header("Location: " . BASE_URL . "/public/messages.php?error=not_in_conversation");
        exit;
    }

    // Insert the message into chat_messages
    $stmt2 = $conn->prepare("INSERT INTO chat_messages (conversation_id, sender_id, message, sent_at) VALUES (?, ?, ?, NOW())");
    $stmt2->execute([$conversation_id, $user_id, $message]);

    // Redirect back to the conversation page
    header("Location: " . BASE_URL . "/public/messages.php?conversation_id=" . $conversation_id);
    exit;
}

header("Location: " . BASE_URL . "/public/messages.php");
exit;
