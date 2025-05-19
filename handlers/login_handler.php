<?php

include_once(__DIR__ . '/../config.php');
include_once(__DIR__ . '/../db.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    try {
        $stmt = $conn->prepare("SELECT id, name, password_hash, role, verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            // 🔒 Check if email is verified
            if ((int) $user['verified'] !== 1) {
                // Redirect to verify email page instead of login error
                header('Location: ' . BASE_URL . '/public/verify_email.php?email=' . urlencode($email));
                exit;
            }

            // If verified, proceed with login
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['role'] = $user['role'];

            if ($user['role'] === 'admin') {
                header('Location: ' . BASE_URL . '/admin/dashboard.php');
            } else {
                header('Location: ' . BASE_URL . '/public/dashboard.php');
            }
            exit;
        } else {
            header('Location: ' . BASE_URL . '/public/login.php?error=invalid_credentials');
            exit;
        }

    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        header('Location: ' . BASE_URL . '/public/login.php?error=unknown');
        exit;
    }
}
