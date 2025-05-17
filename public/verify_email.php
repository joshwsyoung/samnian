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

        // Define the subject and body for the email
        $subject = "Your Verification Code";
        $body = "Here is your verification code: $code.";

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

    <p>A 4-digit code has been sent to <strong><?= htmlspecialchars($email) ?></strong>. Please enter it below to verify your account.</p>

    <form method="POST" action="../handlers/verify_email_handler.php" class="mt-3">
        <input type="hidden" name="email" value="<?= htmlspecialchars($email) ?>">
        <div class="mb-3">
            <label for="code" class="form-label">Verification Code</label>
            <input type="text" name="code" id="code" class="form-control" maxlength="4" pattern="\d{4}" required>
        </div>
        <button type="submit" class="btn">Verify</button>
        <a href="verify_email.php?email=<?= urlencode($email) ?>&resend=1" class="btn btn-link">Resend Code</a>
    </form>
</div>

<?php include '../partials/footer.php'; ?>
