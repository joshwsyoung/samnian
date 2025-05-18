<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

$token = $_GET['token'] ?? '';

if (!$token) {
    die("Invalid request: no token provided.");
}

// Check if token exists and hasn't expired
$stmt = $conn->prepare("SELECT * FROM password_reset_codes WHERE token = ? AND expires_at > NOW() LIMIT 1");
$stmt->execute([$token]);
$entry = $stmt->fetch();

if (!$entry) {
    die("This password reset link is invalid or has expired.");
}
?>

<?php require_once __DIR__ . '/../partials/header.php'; ?>

<div class="container mt-5">
    <h2>Reset Your Password</h2>

    <?php if (isset($_GET['error']) && $_GET['error'] === 'nomatch'): ?>
        <div class="alert alert-danger">Passwords do not match. Please try again.</div>
    <?php endif; ?>

    <form action="<?= BASE_URL ?>/handlers/update_password.php" method="POST">
        <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">

        <div class="mb-3">
            <label for="password" class="form-label">New Password</label>
            <input type="password"
                   class="form-control"
                   name="password"
                   pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
                   title="Password must be at least 8 characters long, with at least one uppercase letter and one number"
                   required
            >
        </div>

        <div class="mb-3">
            <label for="confirm_password" class="form-label">Confirm New Password</label>
            <input type="password" name="confirm_password" class="form-control" required>
        </div>

        <button type="submit" class="btn">Reset Password</button>
    </form>
</div>

<?php require_once __DIR__ . '/../partials/footer.php'; ?>
