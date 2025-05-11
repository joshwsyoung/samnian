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
    $invite_user_id = $_POST['invite_user_id'] ?? null;

    if (!$conversation_id || !$invite_user_id) {
        header("Location: " . BASE_URL . "/public/messages.php?error=missing_data");
        exit;
    }

    // Check if inviter is part of the conversation
    $stmt = $conn->prepare("SELECT 1 FROM conversation_users WHERE conversation_id = ? AND user_id = ?");
    $stmt->execute([$conversation_id, $_SESSION['user_id']]);
    if (!$stmt->fetch()) {
        header("Location: " . BASE_URL . "/public/messages.php?error=not_in_conversation");
        exit;
    }

    // Prevent duplicate invites
    $stmt = $conn->prepare("SELECT 1 FROM conversation_users WHERE conversation_id = ? AND user_id = ?");
    $stmt->execute([$conversation_id, $invite_user_id]);
    if (!$stmt->fetch()) {
        $stmt = $conn->prepare("INSERT INTO conversation_users (conversation_id, user_id, status) VALUES (?, ?, 'pending')");
        $stmt->execute([$conversation_id, $invite_user_id]);
    }

    header("Location: " . BASE_URL . "/public/messages.php?conversation_id=" . $conversation_id);
    exit;
}

header("Location: " . BASE_URL . "/public/messages.php");
exit;
