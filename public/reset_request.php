<?php require_once '../partials/header.php'; ?>
    <div class="container mt-5">
        <h2>Reset Password</h2>
            <form action="send_reset_email.php" method="post">
                <div class="mb-3">
                    <label for="name" class="form-label">Email</label>
                    <input class="form-control" type="email" name="email" placeholder="Enter your email" required>
                    <button class="btn mt-3" type="submit">Send Reset Code</button>
                </div>
            </form>
    </div>

<?php include_once('../partials/footer.php'); ?>