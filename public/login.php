<?php
include_once('../partials/header.php');
include '../config.php';
?>
<div class="container mt-5 mb-4">
    <h2 class="display-6 mb-3">User Login</h2>

    <?php if (isset($_GET['error'])): ?>
        <div class="alert alert-danger">
            <?php
            // Handle error messages
            if ($_GET['error'] == 'invalid_credentials') {
                echo 'Invalid email or password. <a href="reset_request.php">Forgot your password?</a>';
            } elseif ($_GET['error'] == 'user_not_found') {
                echo 'No user found with this email.';
            } elseif ($_GET['error'] == 'unknown') {
                echo 'An unknown error occurred. Please try again.';
            }
            ?>
        </div>
    <?php elseif (isset($_GET['success'])): ?>
        <div class="alert alert-success">
            <?php
            if ($_GET['success'] === 'registered') {
                echo 'Registration successful! You can now log in.';
            } elseif ($_GET['success'] === 'password_reset') {
                echo 'Password reset successful! You can now log in.';
            }
            ?>
        </div>
    <?php endif; ?>

    <form action="../handlers/login_handler.php" method="POST" class="mt-4">
        <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-control" required>
        </div>

        <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <div class="input-group">
                <input type="password" id="password" name="password" class="form-control"
                    pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
                    title="Password must be at least 8 characters long, with at least one uppercase letter and one number"
                    required>
                <button class="toggle-btn" type="button" onclick="togglePassword('password', this)">
                    <i class="bi bi-eye-slash"></i>
                </button>
            </div>
        </div>

        <button type="submit" class="btn">Log In</button>
    </form>
</div>

<?php include_once('../partials/footer.php'); ?>