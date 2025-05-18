<?php

include_once(__DIR__ . '/../config.php');
include_once(__DIR__ . '/../db.php');
include_once(__DIR__ . '/../handlers/mailer.php');
session_start();

// HANDLE RESEND
if (isset($_GET['resend']) && $_GET['resend'] === '1' && isset($_GET['email'])) {
    $email = $_GET['email'];
    $code = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

    // Store it in the DB (create the table if needed)
    $stmt = $conn->prepare("INSERT INTO password_reset_codes (email, code) VALUES (?, ?)");
    $stmt->execute([$email, $code]);

    $subject = 'Your TableTalk password reset code';
    $body = "Your password reset code is: <strong>$code</strong>";
    sendEmail($email, $subject, $body);

    header('Location: ../public/enter_reset_code.php?email=' . urlencode($email) . '&success=resent');
    exit;
}

// Handle form submission with email + code
$email = $_POST['email'] ?? '';
$code = $_POST['code'] ?? '';

if (!$email || !$code) {
    header('Location: ../public/enter_reset_code.php?email=' . urlencode($email) . '&error=missing');
    exit;
}

// Check the code
$stmt = $conn->prepare("SELECT * FROM password_reset_codes WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1");
$stmt->execute([$email, $code]);
$match = $stmt->fetch();

if ($match) {
    // Code is correct — redirect to set new password
    $_SESSION['reset_email'] = $email;
    header('Location: ../public/set_new_password.php');
    exit;
} else {
    // Invalid code
    header('Location: ../public/enter_reset_code.php?email=' . urlencode($email) . '&error=invalid_code');
    exit;
}
?>
