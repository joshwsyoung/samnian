<?php include_once('../partials/header.php'); ?>

<div class="container mt-5">
    <h2>Send Notification to User</h2>

    <!-- Notification form to input user ID -->
    <form action="send_user_notification.php" method="GET" class="mt-4">
        <div class="mb-3">
            <label for="user_id">User ID</label>
            <input type="text" name="user_id" class="form-control" id="user_id" required>
        </div>

        <button type="submit" class="btn btn-primary" id="send-notification-btn">Send Notification</button>
    </form>
</div>

<?php include_once('../partials/footer.php'); ?>
