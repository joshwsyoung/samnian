<?php require_once '../partials/header.php'; ?>
    <div class="container mt-5">
        <h2>Reset Password</h2>
        <form action="<?= BASE_URL ?>/handlers/send_password_reset.php" method="post">
        <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input id="email" class="form-control" type="email" name="email" placeholder="Enter your email" required>
            </div>
            <button class="btn" type="submit">Send Reset Link</button>
        </form>
    </div>
<?php include_once('../partials/footer.php'); ?>