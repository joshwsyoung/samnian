<?php
session_start();
require_once('../db.php');
require_once('../config.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/admin/login.php');
    exit;
}

include_once('../partials/header.php');
?>

<div class="container mt-4">
    <h2>Create New Match</h2>
    <form action="<?= BASE_URL ?>/handlers/create_match_handler.php" method="POST">
        <div class="form-group">
            <label for="event_date">Event Date</label>
            <input type="date" class="form-control" name="event_date" required>
        </div>
        <div class="form-group">
            <label for="slot">Time Slot</label>
            <select class="form-control" name="slot" required>
                <option value="12:00">12:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
                <option value="18:00">18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
            </select>
        </div>
        <div class="form-group">
            <label for="price_point">Price Point</label>
            <select class="form-control" name="price_point" required>
                <option value="£">£</option>
                <option value="££">££</option>
                <option value="£££">£££</option>
            </select>
        </div>
        <div class="form-check mb-3">
            <input type="checkbox" class="form-check-input" name="approved" id="approved">
            <label class="form-check-label" for="approved">Approved</label>
        </div>
        <button type="submit" class="btn btn-success">Create Match</button>
        <a href="<?= BASE_URL ?>/admin/matches.php" class="btn btn-secondary ml-2">Cancel</a>
    </form>
</div>

<?php include_once('../partials/footer.php'); ?>
