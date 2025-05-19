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

    $resetLink = BASE_URL . "/public/reset_password.php?token=$token";

    $subject = 'Reset Your TableTalk Password';

    $body = "
<div style='font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 24px; border-radius: 10px; max-width: 500px; margin: auto; color: #333;'>
    <h2 style='color: #234654;'>Reset Your Password</h2>
    <p style='font-size: 16px;'>Hi there 👋</p>
    <p style='font-size: 16px;'>Click the button below to choose a new password:</p>
    
    <p style='text-align: center; margin: 30px 0;'>
        <a href=\"$resetLink\" 
           style=\"
               display: inline-block;
               padding: 14px 24px;
               font-size: 16px;
               font-weight: bold;
               color: #234654;
               background-color: #d9e3f1;
               text-decoration: none;
               border-radius: 6px;
               box-shadow: 0 2px 6px rgba(0,0,0,0.1);
           \">
            Reset Password
        </a>
    </p>

    <p style='font-size: 14px;'>If you didn’t request this, just ignore this email — no changes will be made.</p>

    <p style='font-size: 14px; margin-top: 20px;'>This link will expire in 1 hour for your security.</p>

    <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>

    <p style='font-size: 12px; color: #777;'>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style='font-size: 12px; word-break: break-all; color: #2a7ae2;'>
        <a href=\"$resetLink\" style='color: #2a7ae2;'>$resetLink</a>
    </p>

    <p style='font-size: 14px; margin-top: 40px;'>Thanks,<br>The TableTalk Team</p>
</div>
";
    sendEmail($email, $subject, $body);
}

header('Location: ../public/reset_requested.php');
exit;
