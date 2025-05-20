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
    $user_id_to_remove = $_POST['user_id'] ?? null;

    if (!$conversation_id || !$user_id_to_remove) {
        header("Location: " . BASE_URL . "/public/messages.php?error=missing_data");
        exit;
    }

    // Check if the current user is part of the conversation
    $stmt = $conn->prepare("SELECT * FROM conversation_users WHERE conversation_id = ? AND user_id = ?");
    $stmt->execute([$conversation_id, $_SESSION['user_id']]);
    $is_participant = $stmt->fetch();

    if (!$is_participant) {
        header("Location: " . BASE_URL . "/public/messages.php?error=not_in_conversation");
        exit;
    }

    // Get creator of the conversation
    $stmt_creator = $conn->prepare("SELECT user_id FROM conversations WHERE id = ?");
    $stmt_creator->execute([$conversation_id]);
    $creator_id = $stmt_creator->fetchColumn();

    // Prevent removing the creator
    if ($user_id_to_remove == $creator_id) {
        header("Location: " . BASE_URL . "/public/messages.php?conversation_id=" . $conversation_id . "&error=cant_remove_creator");
        exit;
    }

    // Remove the user from the conversation
    $stmt = $conn->prepare("DELETE FROM conversation_users WHERE conversation_id = ? AND user_id = ?");
    $stmt->execute([$conversation_id, $user_id_to_remove]);

    header("Location: " . BASE_URL . "/public/messages.php?conversation_id=" . $conversation_id);
    exit;
}

header("Location: " . BASE_URL . "/public/messages.php");
exit;
