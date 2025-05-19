<?php
require_once '../partials/header.php';
?>

<div class="container mt-5">
    <h2>Reset Link Sent</h2>
    <p>If that email is associated with an account, we’ve sent a reset link. Please check your inbox.</p>
    <a href="<?= BASE_URL ?>/public/login.php" class="btn mt-3">Back to Login</a>
</div>

<?php require_once '../partials/footer.php'; ?>
