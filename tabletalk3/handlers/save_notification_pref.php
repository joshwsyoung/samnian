<?php
include_once(__DIR__ . '/../db.php');
include_once(__DIR__ . '/../config.php');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['permission']) || !in_array($data['permission'], ['granted', 'denied'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid permission']);
    exit;
}

// You need to know who's logged in
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE users SET notification_permission = ? WHERE id = ?");
    $stmt->execute([$data['permission'], $_SESSION['user_id']]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

console.log("Requesting notification permission...");

if (Notification.permission === "default") {
    // Request permission if it hasn't been granted or denied yet
    Notification.requestPermission().then(function(permission) {
        console.log("Permission result:", permission);

        // Check the result and send it to your server
        if (permission === "granted") {
            // Send the preference to the server via AJAX (or form submit)
            console.log("Notifications granted!");
            saveNotificationPreference('granted'); // Call function to save preference
        } else if (permission === "denied") {
            console.log("Notifications denied.");
            saveNotificationPreference('denied'); // Call function to save preference
        }
    }).catch(function(error) {
        console.error("Error requesting notification permission:", error);
    });
} else {
    // If permission has already been granted or denied, log that
    console.log("Notification permission already set:", Notification.permission);
    saveNotificationPreference(Notification.permission); // Save already determined permission
}

function saveNotificationPreference(permission) {
    console.log("Saving notification preference:", permission);

    // Send the notification preference to your PHP script
    fetch('../handlers/save_notification_pref.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_permission: permission })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Server response:", data);
        // Handle server response if needed
    })
    .catch(error => {
        console.error("Error saving preference:", error);
    });
}

