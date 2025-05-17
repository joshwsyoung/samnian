<?php 


require_once '../db.php';
require_once '../config.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: " . BASE_URL . "/public/login.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $user_id = $_SESSION['user_id'];
    $invited_users = $_POST['users'] ?? [];

    $match_id = $_POST['match_id'] ?? $_GET['match_id'] ?? null;

    if ($title === '') {
        header("Location: " . BASE_URL . "/public/messages.php?error=missing_title");
        exit;
    }

    // If match_id is provided but no users[], get users from the match
    if ($match_id && empty($invited_users)) {
        $stmt_match = $conn->prepare("SELECT user_id FROM match_users WHERE match_id = ?");
        $stmt_match->execute([$match_id]);
        $invited_users = array_column($stmt_match->fetchAll(), 'user_id');
    }

    // Check if a conversation already exists for this match
    if ($match_id) {
        $stmt_check = $conn->prepare("SELECT id FROM conversations WHERE match_id = ?");
        $stmt_check->execute([$match_id]);
        $existing = $stmt_check->fetch();
        if ($existing) {
            // Conversation already exists, just redirect
            header("Location: " . BASE_URL . "/public/messages.php?conversation_id=" . $existing['id']);
            exit;
        }
    }

    // Create the conversation (with or without match_id)
    if ($match_id) {
        $stmt = $conn->prepare("INSERT INTO conversations (title, user_id, created_at, match_id) VALUES (?, ?, NOW(), ?)");
        $stmt->execute([$title, $user_id, $match_id]);
    } else {
        $stmt = $conn->prepare("INSERT INTO conversations (title, user_id, created_at) VALUES (?, ?, NOW())");
        $stmt->execute([$title, $user_id]);
    }

    $conversation_id = $conn->lastInsertId();

    // Add creator as accepted
    $stmt2 = $conn->prepare("INSERT INTO conversation_users (conversation_id, user_id, status) VALUES (?, ?, 'accepted')");
    $stmt2->execute([$conversation_id, $user_id]);

    // Add invitees (excluding self)
    $stmt3 = $conn->prepare("INSERT INTO conversation_users (conversation_id, user_id, status) VALUES (?, ?, 'pending')");
    foreach ($invited_users as $invitee_id) {
        if ($invitee_id != $user_id) {
            $stmt3->execute([$conversation_id, $invitee_id]);
        }
    }

    header("Location: " . BASE_URL . "/public/messages.php?conversation_id=" . $conversation_id);
    exit;
}

header("Location: " . BASE_URL . "/public/messages.php");
exit;
