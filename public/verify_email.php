<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

include_once(__DIR__ . '/../config.php');
include_once(__DIR__ . '/../db.php');
include_once(__DIR__ . '/../handlers/mailer.php');

$email = isset($_GET['email']) ? filter_var($_GET['email'], FILTER_SANITIZE_EMAIL) : null;

if (!$email) {
    header('Location: ' . BASE_URL . '/public/register.php?error=missing_email');
    exit;
}

// Optional resend
if (isset($_GET['resend']) && $_GET['resend'] === '1') {
    $stmt = $conn->prepare("SELECT code FROM email_verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if ($row) {
        $code = $row['code'];
        $subject = 'Your TableTalk Verification Code';
        $body = "
            <div style='font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto;'>
                <h2 style='color: #234654;'>Verify Your Email</h2>
                <p style='font-size: 16px; color: #333;'>Hi there! 👋</p>
                <p style='font-size: 16px; color: #333;'>Your TableTalk verification code is:</p>
                <p style='font-size: 32px; font-weight: bold; color: #234654; margin: 20px 0;'>$code</p>
                <p style='font-size: 14px; color: #666;'>Please enter this code on the website to complete your registration.</p>
                <hr style='margin: 30px 0;'>
                <p style='font-size: 12px; color: #aaa;'>If you didn’t sign up for TableTalk, you can safely ignore this email.</p>
            </div>
        ";

        // Send the email
        sendEmail($email, $subject, $body);
        $resent = true;
    }
}
?>

<?php include '../partials/header.php'; ?>

<div class="container mt-5 mb-4">
    <h2 class="display-6 mb-3">Email Verification</h2>

    <?php if (!empty($resent)): ?>
        <div class="alert alert-success">Verification code resent to <strong><?= htmlspecialchars($email) ?></strong>.</div>
    <?php endif; ?>

    <p>A 4-digit code has been sent to <strong><?= htmlspecialchars($email) ?></strong>. Please enter it below to verify
        your account.</p>

    <form method="POST" action="../handlers/verify_email_handler.php" class="mt-3" id="codeForm">
        <input type="hidden" name="email" value="<?= htmlspecialchars($email) ?>">
        <input type="hidden" name="code" id="fullCode" value="">

        <div class="mb-3">
            <label for="code" class="form-label">Verification Code</label>
            <div class="d-flex gap-2">
                <input type="text" maxlength="1" class="form-control text-center code-input" required>
                <input type="text" maxlength="1" class="form-control text-center code-input" required>
                <input type="text" maxlength="1" class="form-control text-center code-input" required>
                <input type="text" maxlength="1" class="form-control text-center code-input" required>
            </div>
        </div>

        <button type="submit" class="btn">Verify</button>
        <a href="verify_email.php?email=<?= urlencode($email) ?>&resend=1" class="btn btn-link">Resend Code</a>
    </form>
</div>

<?php include '../partials/footer_no_nav.php'; ?>