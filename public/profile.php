<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
include_once('../config.php');
include_once('../db.php');
include_once('../partials/auth_check.php');
include_once('../partials/header.php');

// Fetch user data
$user_id = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    echo "<div class='alert alert-danger text-center'>User not found.</div>";
    include_once('../partials/footer.php');
    exit;
}
?>

<div class="container py-5">
    <div class="text-center mb-4">
        <h1>Your Profile</h1>
        <p class="text-muted">Here’s what we’ve got on file for you.</p>
    </div>

    <div class="card shadow-sm mx-auto" style="max-width: 500px;">
        <div class="card-body fw-light fs-6">
            <p><strong>Name:</strong> <?= htmlspecialchars($user['name']) ?></p>
            <p><strong>Email:</strong> <?= htmlspecialchars($user['email']) ?></p>
            <p><strong>Phone:</strong> <?= htmlspecialchars($user['phone']) ?></p>
            <p><strong>Age:</strong> <?= htmlspecialchars($user['age']) ?></p>
            <p><strong>City:</strong> <?= htmlspecialchars($user['city']) ?></p>

            <button class="btn btn-secondary mt-3" data-bs-toggle="modal" data-bs-target="#updateProfileModal">
                Edit Profile
            </button>
        </div>
    </div>
</div>

<!-- Update Profile Modal -->
<div class="modal fade" id="updateProfileModal" tabindex="-1" aria-labelledby="updateProfileModalLabel"
    aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content fw-lighter">
            <div class="modal-header">
                <h5 class="modal-title" id="updateProfileModalLabel">Update Your Profile</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form action="../handlers/update_profile_handler.php" method="POST">
                    <div class="mb-3">
                        <label for="name">Name</label>
                        <input type="text" name="name" class="form-control"
                            value="<?= htmlspecialchars($user['name']) ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="email">Email</label>
                        <input type="email" class="form-control" name="email"
                            value="<?= htmlspecialchars($user['email']) ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="phone">Phone</label>
                        <input type="text" class="form-control" name="phone"
                            value="<?= htmlspecialchars($user['phone']) ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="age">Age</label>
                        <input type="number" class="form-control" name="age"
                            value="<?= htmlspecialchars($user['age']) ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="city">City</label>
                        <select class="form-select" name="city" required>
                            <?php
                            $cities = ['Marlow', 'London', 'Bristol', 'Durban SA'];
                            foreach ($cities as $city) {
                                $selected = ($user['city'] === $city) ? 'selected' : '';
                                echo "<option value=\"$city\" $selected>$city</option>";
                            }
                            ?>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary mt-3">Save Changes</button>
                </form>

                <hr>

                <!-- Delete Account Button -->
                <form action="../handlers/delete_account_handler.php" method="POST"
                    onsubmit="return confirm('Are you sure you want to delete your account? This cannot be undone.');">
                    <button type="submit" class="btn btn-outline-danger">Delete Account</button>
                </form>
            </div>
        </div>
    </div>
</div>

<?php include_once('../partials/footer.php'); ?>