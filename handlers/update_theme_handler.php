<?php
session_start();
require_once('../config.php');
if (!isset($_SESSION['user_id']) || !isset($_POST['theme']))
    exit;
$user_id = $_SESSION['user_id'];
$theme = $_POST['theme'] === 'dark' ? 'dark' : 'light';
$stmt = $conn->prepare("UPDATE users SET theme = ? WHERE id = ?");
$stmt->execute([$theme, $user_id]);
?>