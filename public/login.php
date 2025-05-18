<?php
include_once('../partials/header.php');
include '../config.php';


//NEW NOTIFICATION FLOW ADDED


 if (isset($_GET['success']) && $_GET['success'] == 1): ?>
<script>

if (typeof Notification !== 'undefined') {
    console.log('Notification API available');
} else {
    console.log('Notification API not available');
}

Notification.requestPermission().then(permission => {
    console.log('Permission result:', permission);
    // The rest of your logic here
}).catch(error => {
    console.error('Error requesting notification permission:', error);
});

console.log('Checking notification permissions...');
if (Notification && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
        console.log('Permission result:', permission);

        fetch('../handlers/save_notification_pref.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permission })
        });

        if (permission === 'granted') {
            const alert = document.createElement('div');
            alert.className = 'alert alert-success text-center';
            alert.textContent = 'Thanks! You’ll now receive TableTalk notifications.';
            document.body.prepend(alert);

            setTimeout(() => alert.remove(), 5000);
        }
    });
}

    document.addEventListener('DOMContentLoaded', () => {
        if (Notification && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                fetch('../handlers/save_notification_pref.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ permission })
                });

                if (permission === 'granted') {
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-success text-center';
                    alert.textContent = 'Thanks! You’ll now receive TableTalk notifications.';
                    document.body.prepend(alert);

                    setTimeout(() => alert.remove(), 5000);
                }
            });
        }
    });
</script>
<?php endif; 


// NOTIFICATION FLOW ENDS
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
        <div class="alert alert-success">Registration successful! Please log in.</div>
    <?php endif; ?>

    <form action="../handlers/login_handler.php" method="POST" class="mt-4">
        <div class="mb-3">
            <label>Email</label>
            <input type="email" name="email" class="form-control" required>
        </div>

        <div class="mb-3">
            <label>Password</label>
            <input type="password" name="password" class="form-control" required>
        </div>

        <button type="submit" class="btn">Log In</button>
    </form>
</div>

<?php include_once('../partials/footer.php'); ?>
