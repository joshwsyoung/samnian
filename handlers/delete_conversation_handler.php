<?php

require_once '../config.php';
require_once '../db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: " . BASE_URL . "/public/login.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conversation_id = $_POST['conversation_id'] ?? null;

    if (!$conversation_id) {
        header("Location: " . BASE_URL . "/public/messages.php?error=missing_id");
        exit;
    }

    // Check if current user is the creator
    $stmt = $conn->prepare("SELECT user_id FROM conversations WHERE id = ?");
    $stmt->execute([$conversation_id]);
    $creator_id = $stmt->fetchColumn();

    if ($creator_id != $_SESSION['user_id']) {
        header("Location: " . BASE_URL . "/public/messages.php?error=not_creator");
        exit;
    }

    // Delete chat messages
    $conn->prepare("DELETE FROM chat_messages WHERE conversation_id = ?")->execute([$conversation_id]);

    // Delete user links
    $conn->prepare("DELETE FROM conversation_users WHERE conversation_id = ?")->execute([$conversation_id]);

    // Delete the conversation itself
    $conn->prepare("DELETE FROM conversations WHERE id = ?")->execute([$conversation_id]);

    header("Location: " . BASE_URL . "/public/messages.php?deleted=1");
    exit;
}

header("Location: " . BASE_URL . "/public/messages.php");
exit;
