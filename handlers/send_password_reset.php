<?php
include_once(__DIR__ . '/../config.php');
include_once(__DIR__ . '/../db.php');
include_once(__DIR__ . '/../handlers/mailer.php');

$email = $_POST['email'] ?? '';

if (!$email) {
    header('Location: ../public/forgot_password.php?error=missing');
    exit;
}

// Optional: check if user exists
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    // Generate secure token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour from now

    // Store in DB
    $stmt = $conn->prepare("INSERT INTO password_reset_codes (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expires]);

    // Send email with reset link
    $resetLink = BASE_URL . "/public/reset_password.php?token=$token";
    $subject = "Reset your password";
    $body = "Click this link to reset your password:<br><br><a href='$resetLink'>$resetLink</a><br><br>This link expires in 1 hour.";
    sendEmail($email, $subject, $body);
}

header('Location: ../public/reset_requested.php');
exit;
?>

