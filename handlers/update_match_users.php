<?php
session_start();
require_once('../config.php');
require_once('../db.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    $_SESSION['error'] = 'Unauthorized access.';
    header('Location: ' . BASE_URL . '/public/login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $match_id = $_POST['match_id'];
    $user_id  = $_POST['user_id'];
    $action   = $_POST['action']; // 'add' or 'remove'

    try {
        // Check if match exists
        $stmt = $conn->prepare("SELECT id FROM matches WHERE id = ?");
        $stmt->execute([$match_id]);
        $match = $stmt->fetch();

        if (!$match) {
            $_SESSION['error'] = 'Match not found.';
            header('Location: ' . BASE_URL . '/admin/matches.php');
            exit;
        }

        if ($action === 'add') {
            // Add the user to the match
            $stmt = $conn->prepare("INSERT INTO match_users (match_id, user_id) VALUES (?, ?)");
            $stmt->execute([$match_id, $user_id]);
        } elseif ($action === 'remove') {
            // Remove the user from the match
            $stmt = $conn->prepare("DELETE FROM match_users WHERE match_id = ? AND user_id = ?");
            $stmt->execute([$match_id, $user_id]);
        }

        $_SESSION['success'] = 'User updated successfully.';
        header('Location: ' . BASE_URL . '/admin/edit_match.php?id=' . $match_id);
        exit;
    } catch (PDOException $e) {
        $_SESSION['error'] = 'Failed to update user in match.';
        header('Location: ' . BASE_URL . '/admin/edit_match.php?id=' . $match_id);
        exit;
    }
}

$_SESSION['error'] = 'Invalid request.';
header('Location: ' . BASE_URL . '/admin/matches.php');
exit;
