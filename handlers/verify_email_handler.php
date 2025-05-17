<?php

/*
include_once(__DIR__ . '/../config.php');
include_once(__DIR__ . '/../db.php');

$email = $_POST['email'] ?? '';
$code = $_POST['code'] ?? '';

if (!$email || !$code) {
    header('Location: ../public/verify_email.php?email=' . urlencode($email) . '&error=missing');
    exit;
}

// Check code
$stmt = $conn->prepare("SELECT * FROM email_verification_codes WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1");
$stmt->execute([$email, $code]);
$match = $stmt->fetch();

if ($match) {
    // Update user as verified
    $stmt = $conn->prepare("UPDATE users SET verified = 1 WHERE email = ?");
    $stmt->execute([$email]);


    $stmt = $conn->prepare("DELETE FROM email_verification_codes WHERE email = ?");
    $stmt->execute([$email]);

    // Check code
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email]);
   
    $user = $stmt->fetch(); // or rename $get_user to $user

    if ($user) {
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['role']      = $user['role'];

        header('Location: ../public/dashboard.php?success=verified');
        exit;
    } else {
        // Handle unexpected missing user case
        header('Location: ../public/verify_email.php?email=' . urlencode($email) . '&error=user_not_found');
        exit;
}
}


*/


include_once(__DIR__ . '/../config.php');
include_once(__DIR__ . '/../db.php');
include_once(__DIR__ . '/../handlers/mailer.php');
session_start();

// HANDLE RESEND REQUEST FIRST
if (isset($_GET['resend']) && $_GET['resend'] === '1' && isset($_GET['email'])) {
    $email = $_GET['email'];

    // Generate new code
    $code = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

    // Store it in the database
    $stmt = $conn->prepare("INSERT INTO email_verification_codes (email, code) VALUES (?, ?)");
    $stmt->execute([$email, $code]);

    // Send email with three parameters: email, subject, and body
    $subject = 'Your TableTalk verification code';
    $body = "Your verification code is: <strong>$code</strong>";
    sendEmail($email, $subject, $body); // Correct number of parameters

    // Redirect back with success message
    header('Location: ../public/verify_email.php?email=' . urlencode($email) . '&success=resent');
    exit;
}

// Check if email and code are provided
$email = $_POST['email'] ?? '';
$code = $_POST['code'] ?? '';

if (!$email || !$code) {
    // Redirect if either email or code is missing
    header('Location: ../public/verify_email.php?email=' . urlencode($email) . '&error=missing');
    exit;
}

// Check if the verification code matches the one in the database
$stmt = $conn->prepare("SELECT * FROM email_verification_codes WHERE email = ? AND code = ? ORDER BY created_at DESC LIMIT 1");
$stmt->execute([$email, $code]);
$match = $stmt->fetch();

if ($match) {
    // Code matches, proceed with updating the user as verified
    $stmt = $conn->prepare("UPDATE users SET verified = 1 WHERE email = ?");
    $stmt->execute([$email]);

    // Delete the verification code after use
    $stmt = $conn->prepare("DELETE FROM email_verification_codes WHERE email = ?");
    $stmt->execute([$email]);

    // Retrieve the updated user information
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // Set session variables if the user exists
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['role'] = $user['role'];

        // Redirect to the dashboard with success message
        header('Location: ../public/dashboard.php?success=verified');
        exit;
    } else {
        // If user does not exist, redirect with an error
        header('Location: ../public/verify_email.php?email=' . urlencode($email) . '&error=user_not_found');
        exit;
    }
} else {
    // Code doesn't match, redirect with an error
    header('Location: ../public/verify_email.php?email=' . urlencode($email) . '&error=invalid_code');
    exit;
}
?>
