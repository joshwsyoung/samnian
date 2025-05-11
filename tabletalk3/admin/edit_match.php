<?php
session_start();
require_once('../db.php');
require_once('../config.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/admin/login.php');
    exit;
}

if (!isset($_GET['id'])) {
    header('Location: ' . BASE_URL . '/admin/matches.php?error=missing_id');
    exit;
}

$match_id = $_GET['id'];

$stmt = $conn->prepare("SELECT * FROM matches WHERE id = ?");
$stmt->execute([$match_id]);
$match = $stmt->fetch();

if (!$match) {
    header('Location: ' . BASE_URL . '/admin/matches.php?error=not_found');
    exit;
}

include_once('../partials/header.php');
?>

<div class="container mt-4">
    <h2>Edit Match</h2>
    <form action="<?= BASE_URL ?>/handlers/edit_match_handler.php" method="POST">
        <input type="hidden" name="id" value="<?= htmlspecialchars($match['id']) ?>">
        
        <div class="form-group">
            <label for="event_date">Event Date</label>
            <input type="date" class="form-control" name="event_date" value="<?= $match['event_date'] ?>" required>
        </div>

        <div class="form-group">
            <label for="slot">Time Slot</label>
            <select class="form-control" name="slot" required>
                <?php
                $slots = ['12:00','13:00','14:00','18:00','19:00','20:00'];
                foreach ($slots as $s) {
                    echo "<option value=\"$s\"".($match['slot'] === $s ? ' selected' : '').">$s</option>";
                }
                ?>
            </select>
        </div>

        <div class="form-group">
            <label for="price_point">Price Point</label>
            <select class="form-control" name="price_point" required>
                <?php
                $points = ['£','££','£££'];
                foreach ($points as $p) {
                    echo "<option value=\"$p\"".($match['price_point'] === $p ? ' selected' : '').">$p</option>";
                }
                ?>
            </select>
        </div>

        <div class="form-check mb-3">
            <input type="checkbox" class="form-check-input" name="approved" id="approved" <?= $match['approved'] ? 'checked' : '' ?>>
            <label class="form-check-label" for="approved">Approved</label>
        </div>

        <button type="submit" class="btn btn-primary">Save Changes</button>
        <a href="<?= BASE_URL ?>/admin/matches.php" class="btn btn-secondary ml-2">Cancel</a>
    </form>

    <h3 class="mt-5">Manage Users in This Match</h3>

    <!-- Assigned Users Table -->
    <h5>Assigned Users</h5>
    <table class="table table-bordered mb-3">
        <thead>
            <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Location</th>
                <th>Availability</th>
                <th>Price Point</th>
                <th>O</th>
                <th>C</th>
                <th>E</th>
                <th>A</th>
                <th>N</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
        <?php
        $assigned = $conn->prepare("SELECT u.id, u.name, u.age, u.city, a.event_date, a.slot, m.price_point, 
                                           ps.openness, ps.conscientiousness, ps.extraversion, ps.agreeableness, ps.neuroticism
                                    FROM users u
                                    JOIN match_users mu ON u.id = mu.user_id
                                    JOIN availability a ON u.id = a.user_id
                                    JOIN matches m ON mu.match_id = m.id
                                    LEFT JOIN personality_scores ps ON u.id = ps.user_id
                                    WHERE mu.match_id = ? 
                                    AND a.event_date IS NOT NULL 
                                    AND a.slot IS NOT NULL 
                                    AND m.price_point IS NOT NULL
                                    AND u.city IS NOT NULL 
                                    AND ps.user_id IS NOT NULL");
        $assigned->execute([$match_id]);
        foreach ($assigned as $user): ?>
            <tr>
                <td><?= htmlspecialchars($user['id']) ?></td>
                <td><?= htmlspecialchars($user['name']) ?></td>
                <td><?= htmlspecialchars($user['age']) ?></td>
                <td><?= htmlspecialchars($user['city']) ?></td>
                <td><?= htmlspecialchars($user['event_date']) ?> at <?= htmlspecialchars($user['slot']) ?></td>
                <td><?= htmlspecialchars($user['price_point']) ?></td>
                <td><?= htmlspecialchars($user['openness']) ?></td>
                <td><?= htmlspecialchars($user['conscientiousness']) ?></td>
                <td><?= htmlspecialchars($user['extraversion']) ?></td>
                <td><?= htmlspecialchars($user['agreeableness']) ?></td>
                <td><?= htmlspecialchars($user['neuroticism']) ?></td>
                <td>
                    <form action="<?= BASE_URL ?>/handlers/update_match_users.php" method="POST" class="m-0">
                        <input type="hidden" name="action" value="remove">
                        <input type="hidden" name="match_id" value="<?= $match_id ?>">
                        <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
                        <button class="btn btn-sm btn-danger">Remove</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <!-- Unassigned Users Table -->
    <h5>Available Users</h5>
    <table class="table table-bordered">
        <thead>
            <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Location</th>
                <th>Availability</th>
                <th>Price Point</th>
                <th>O</th>
                <th>C</th>
                <th>E</th>
                <th>A</th>
                <th>N</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
        <?php
        $unassigned = $conn->prepare("
            SELECT u.id, u.name, u.age, u.city, a.event_date, a.slot, m.price_point,
                   ps.openness, ps.conscientiousness, ps.extraversion, ps.agreeableness, ps.neuroticism
            FROM users u
            LEFT JOIN availability a ON u.id = a.user_id
            LEFT JOIN matches m ON m.id = ?
            LEFT JOIN personality_scores ps ON u.id = ps.user_id
            WHERE u.id NOT IN (SELECT user_id FROM match_users WHERE match_id = ?)
            AND a.event_date IS NOT NULL 
            AND a.slot IS NOT NULL 
            AND m.price_point IS NOT NULL
            AND u.city IS NOT NULL 
            AND ps.user_id IS NOT NULL
        ");
        $unassigned->execute([$match_id, $match_id]);
        foreach ($unassigned as $user): ?>
            <tr>
                <td><?= htmlspecialchars($user['id']) ?></td>
                <td><?= htmlspecialchars($user['name']) ?></td>
                <td><?= htmlspecialchars($user['age']) ?></td>
                <td><?= htmlspecialchars($user['city']) ?></td>
                <td><?= htmlspecialchars($user['event_date']) ?> at <?= htmlspecialchars($user['slot']) ?></td>
                <td><?= htmlspecialchars($user['price_point']) ?></td>
                <td><?= htmlspecialchars($user['openness']) ?></td>
                <td><?= htmlspecialchars($user['conscientiousness']) ?></td>
                <td><?= htmlspecialchars($user['extraversion']) ?></td>
                <td><?= htmlspecialchars($user['agreeableness']) ?></td>
                <td><?= htmlspecialchars($user['neuroticism']) ?></td>
                <td>
                    <form action="<?= BASE_URL ?>/handlers/update_match_users.php" method="POST" class="m-0">
                        <input type="hidden" name="action" value="add">
                        <input type="hidden" name="match_id" value="<?= $match_id ?>">
                        <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
                        <button class="btn btn-sm btn-success">Add</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

</div>

<?php include_once('../partials/footer.php'); ?>
