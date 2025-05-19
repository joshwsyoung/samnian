<?php
session_start(); // Ensure the session is started

// Include database connection
require_once '../config.php';
require_once '../db.php';

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    // Redirect to login if not logged in
    header('Location: ../public/login.php');
    exit();
}

// Get the current user ID
$user_id = $_SESSION['user_id'];

// Check if the form is submitted and the interests are selected
if (isset($_POST['selected_interests']) && !empty($_POST['selected_interests'])) {
    $selected_interests = explode(',', $_POST['selected_interests']);
    // Prepare to update the user interests
    try {
        // Begin a transaction
        $conn->beginTransaction();
        
        // Delete existing user interests
        $stmtDelete = $conn->prepare("DELETE FROM user_interests WHERE user_id = ?");
        $stmtDelete->execute([$user_id]);
        
        // Insert the selected interests for the user
        $stmtInsert = $conn->prepare("INSERT INTO user_interests (user_id, interest_id) SELECT ?, id FROM interests WHERE name = ?");
        
        // Loop through the selected interests and insert them into the user_interests table
        foreach ($selected_interests as $interest_name) {
            $stmtInsert->execute([$user_id, $interest_name]);
        }
        
        // Commit the transaction
        $conn->commit();

        // Set success message
        $_SESSION['success'] = 'Your interests have been updated successfully!';
        
        // Redirect to dashboard or any page you want after the update
        header('Location: ../public/dashboard.php');
        exit();
        
    } catch (PDOException $e) {
        // Rollback the transaction in case of an error
        $conn->rollBack();
        // Optionally, log the error or show an error message
        error_log("Error updating user interests: " . $e->getMessage());
        // Redirect back to the dashboard with an error message
        $_SESSION['error'] = 'An error occurred while updating your interests. Please try again later.';
        header('Location: ../public/dashboard.php');
        exit();
    }
} else {
    // No interests were selected
    $_SESSION['error'] = 'Please select at least one interest.';
    header('Location: ../public/dashboard.php');
    exit();
}
?>
