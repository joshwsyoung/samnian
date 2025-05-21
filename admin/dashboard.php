<?php

session_start();
require_once('../config.php');
require_once('../db.php');


// Check if the user is logged in and if they are an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/public/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];
$user_name = $_SESSION['user_name'];
?>

<?php include_once('../partials/header.php'); ?>

<div class="container mt-5">
    <h2>Welcome, Admin <?= htmlspecialchars($user_name) ?>!</h2>

    <div class="row mt-4">
        <!-- User Management Section -->
        <div class="col-md-4">
            <h4>User Management</h4>
            <ul class="list-group">
                <li class="list-group-item">
                    <a href="users.php">View/Edit Users</a>
                </li>
                <li class="list-group-item">
                    <a href="matches.php">View Matches</a>
                </li>
            </ul>
        </div>

        <!-- Match Management Section -->
        <div class="col-md-4">
            <h4>Match Management</h4>
            <ul class="list-group">
                <li class="list-group-item">
                    <a href="create_match.php">Create New Match</a>
                </li>
                <li class="list-group-item">
                    <a href="edit_match.php">Edit Existing Match</a>
                </li>
            </ul>
        </div>

        <!-- Chat Management Section -->
        <div class="col-md-4">
            <h4>Chat Management</h4>
            <ul class="list-group">
                <li class="list-group-item">
                    <a href="chat.php">View Chats</a>
                </li>
            </ul>
        </div>
    </div>
</div>

<?php include_once('../partials/footer.php'); ?>