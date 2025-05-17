<?php
// Include database connection
include('../db.php');
include('../config.php');

// Get the user_id from the GET request
$userId = $_GET['user_id'] ?? null;

if ($userId) {
    // Get the user's notification preferences from the database
    $stmt = $conn->prepare("SELECT notification_permission FROM users WHERE id = :user_id");
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $notificationPref = $user['notification_permission'];

        // Check if the user has granted permission for notifications
        if ($notificationPref === 'default') {
            // Trigger notification logic (send browser notification)
            sendBrowserNotification($userId);
        } else {
            echo "User has not granted notification permission.";
        }
    } else {
        echo "User not found.";
    }
} else {
    echo "No user ID provided.";
}

function sendBrowserNotification($userId) {
    // Define the notification content
    $notificationTitle = "TableTalk Notification";
    $notificationBody = "You have a new message or update in TableTalk!";
    
    // This should be stored in your frontend JavaScript (on the user's browser)
    $script = <<<HTML
    <script>
        if (Notification.permission === "granted") {
            const notification = new Notification("$notificationTitle", {
                body: "$notificationBody",
                icon: "path/to/icon.png",  // Optional icon for the notification
            });

            // Optional: Action when the notification is clicked
            notification.onclick = function() {
                window.location.href = "https://dev.queensgatecreative.com/tabletalk3/public/send_notification_form.php";  // Redirect when clicked
            };
        } else {
            console.log("Notification permission not granted.");
        }
    </script>
    HTML;

    // Send script to the browser to trigger the notification
    echo $script; 
}
?>
