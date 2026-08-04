<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
require_once('../config.php');
require_once('../db.php');

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

// Fetch all unique cities from users table
$cityOptions = $conn->query("SELECT DISTINCT city FROM users WHERE city IS NOT NULL AND city != '' ORDER BY city ASC")->fetchAll(PDO::FETCH_COLUMN);

// Fetch all unique price points from users table
$pricePoints = $conn->query("SELECT DISTINCT price_point FROM users WHERE price_point IS NOT NULL AND price_point != '' ORDER BY price_point ASC")->fetchAll(PDO::FETCH_COLUMN);

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
                $slots = ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00'];
                foreach ($slots as $s) {
                    echo "<option value=\"$s\"" . ($match['slot'] === $s ? ' selected' : '') . ">$s</option>";
                }
                ?>
            </select>
        </div>

        <div class="form-group">
            <label for="price_point">Price Point</label>
            <select class="form-control" name="price_point" required>
                <?php
                $points = ['£', '££', '£££'];
                foreach ($points as $p) {
                    echo "<option value=\"$p\"" . ($match['price_point'] === $p ? ' selected' : '') . ">$p</option>";
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

    <!-- Filter Form (above tables) -->
    <form method="get" class="mb-4">
        <input type="hidden" name="id" value="<?= htmlspecialchars($match_id) ?>">
        <div class="row g-2">
            <div class="col-md-2">
                <select class="form-select" name="city">
                    <option value="">Any City</option>
                    <?php foreach ($cityOptions as $city): ?>
                        <option value="<?= htmlspecialchars($city) ?>" <?= (isset($_GET['city']) && $_GET['city'] == $city) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($city) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" name="age" class="form-control" placeholder="Age"
                    value="<?= htmlspecialchars($_GET['age'] ?? '') ?>">
            </div>
            <div class="col-md-2">
                <select name="interest" class="form-select">
                    <option value="">Any Interest</option>
                    <?php
                    $allInterests = $conn->query("SELECT id, name FROM interests")->fetchAll();
                    foreach ($allInterests as $interest) {
                        $selected = (isset($_GET['interest']) && $_GET['interest'] == $interest['id']) ? 'selected' : '';
                        echo "<option value=\"{$interest['id']}\" $selected>" . htmlspecialchars($interest['name']) . "</option>";
                    }
                    ?>
                </select>
            </div>
            <div class="col-md-2">
                <select name="price_point" class="form-select">
                    <option value="">Any Price Point</option>
                    <?php foreach ($pricePoints as $pp): ?>
                        <option value="<?= htmlspecialchars($pp) ?>" <?= (isset($_GET['price_point']) && $_GET['price_point'] == $pp) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($pp) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-2">
                <button class="btn btn-primary w-100" type="submit">Filter</button>
            </div>
        </div>
    </form>

    <!-- Assigned Users Table -->
    <h5>Assigned Users</h5>
    <table class="table table-bordered mb-3">
        <thead>
            <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Location</th>
                <th>Price Point</th>
                <th>O</th>
                <th>C</th>
                <th>E</th>
                <th>A</th>
                <th>N</th>
                <th>Interests</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $assigned = $conn->prepare("SELECT u.id, u.name, u.age, u.city, a.event_date, a.slot, m.price_point, 
                                           ps.openness, ps.conscientiousness, ps.extraversion, ps.agreeableness, ps.neuroticism
                                    FROM users u
                                    JOIN match_users mu ON u.id = mu.user_id
                                    LEFT JOIN availability a ON u.id = a.user_id
                                    JOIN matches m ON mu.match_id = m.id
                                    LEFT JOIN personality_scores ps ON u.id = ps.user_id
                                    WHERE mu.match_id = ?");
            $assigned->execute([$match_id]);
            foreach ($assigned as $user):
                // Fetch interests for this user
                $stmtInterests = $conn->prepare("
                    SELECT i.name 
                    FROM user_interests ui 
                    JOIN interests i ON ui.interest_id = i.id 
                    WHERE ui.user_id = ?
                ");
                $stmtInterests->execute([$user['id']]);
                $user_interests = array_column($stmtInterests->fetchAll(), 'name');
                ?>
                <tr>
                    <td><?= htmlspecialchars($user['id']) ?></td>
                    <td><?= htmlspecialchars($user['name']) ?></td>
                    <td><?= htmlspecialchars($user['age']) ?></td>
                    <td><?= htmlspecialchars($user['city']) ?></td>
                    <td><?= htmlspecialchars($user['price_point']) ?></td>
                    <td><?= $user['openness'] === null ? '' : htmlspecialchars($user['openness']) ?></td>
                    <td><?= $user['conscientiousness'] === null ? '' : htmlspecialchars($user['conscientiousness']) ?></td>
                    <td><?= $user['extraversion'] === null ? '' : htmlspecialchars($user['extraversion']) ?></td>
                    <td><?= $user['agreeableness'] === null ? '' : htmlspecialchars($user['agreeableness']) ?></td>
                    <td><?= $user['neuroticism'] === null ? '' : htmlspecialchars($user['neuroticism']) ?></td>
                    <td>
                        <?php if (!empty($user_interests)): ?>
                            <?= htmlspecialchars(implode(', ', $user_interests)) ?>
                        <?php else: ?>
                            <span class="text-muted">None</span>
                        <?php endif; ?>
                    </td>
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
                <th>Price Point</th>
                <th>O</th>
                <th>C</th>
                <th>E</th>
                <th>A</th>
                <th>N</th>
                <th>Interests</th>

                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $where = "u.id NOT IN (SELECT user_id FROM match_users WHERE match_id = ?)";
            $params = [$match_id];

            if (!empty($_GET['city'])) {
                $where .= " AND u.city = ?";
                $params[] = $_GET['city'];
            }
            if (!empty($_GET['age'])) {
                $where .= " AND u.age = ?";
                $params[] = $_GET['age'];
            }
            if (!empty($_GET['interest'])) {
                $where .= " AND EXISTS (
                    SELECT 1 FROM user_interests ui
                    WHERE ui.user_id = u.id AND ui.interest_id = ?
                )";
                $params[] = $_GET['interest'];
            }
            if (!empty($_GET['price_point'])) {
                $where .= " AND u.price_point = ?";
                $params[] = $_GET['price_point'];
            }

            $sql = "
                SELECT u.id, u.name, u.age, u.city, u.price_point,
                       ps.openness, ps.conscientiousness, ps.extraversion, ps.agreeableness, ps.neuroticism
                FROM users u
                LEFT JOIN personality_scores ps ON u.id = ps.user_id
                WHERE $where
            ";
            $unassigned = $conn->prepare($sql);
            $unassigned->execute($params);
            foreach ($unassigned as $user):
                $stmtInterests = $conn->prepare("
                    SELECT i.name 
                    FROM user_interests ui 
                    JOIN interests i ON ui.interest_id = i.id 
                    WHERE ui.user_id = ?
                ");
                $stmtInterests->execute([$user['id']]);
                $user_interests = array_column($stmtInterests->fetchAll(), 'name');
                ?>
                <tr>
                    <td><?= htmlspecialchars($user['id']) ?></td>
                    <td><?= htmlspecialchars($user['name']) ?></td>
                    <td><?= htmlspecialchars($user['age']) ?></td>
                    <td><?= htmlspecialchars($user['city']) ?></td>
                    <td><?= htmlspecialchars($user['price_point']) ?></td>
                    <td><?= $user['openness'] === null ? '' : htmlspecialchars($user['openness']) ?></td>
                    <td><?= $user['conscientiousness'] === null ? '' : htmlspecialchars($user['conscientiousness']) ?></td>
                    <td><?= $user['extraversion'] === null ? '' : htmlspecialchars($user['extraversion']) ?></td>
                    <td><?= $user['agreeableness'] === null ? '' : htmlspecialchars($user['agreeableness']) ?></td>
                    <td><?= $user['neuroticism'] === null ? '' : htmlspecialchars($user['neuroticism']) ?></td>
                    <td>
                        <?php if (!empty($user_interests)): ?>
                            <?= htmlspecialchars(implode(', ', $user_interests)) ?>
                        <?php else: ?>
                            <span class="text-muted">None</span>
                        <?php endif; ?>
                    </td>
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