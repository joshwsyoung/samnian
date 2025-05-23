<?php
session_start();
include_once('../partials/header.php');
include_once('../config.php');
include_once('../db.php');
include_once('../partials/auth_check.php');

$user_id = $_SESSION['user_id'];

// Fetch user data
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

// Fetch availability
$stmt = $conn->prepare("SELECT * FROM availability WHERE user_id = ?");
$stmt->execute([$user_id]);
$availability = $stmt->fetchAll();

// Fetch price point
$stmt = $conn->prepare("SELECT price_point FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$price_point = $stmt->fetchColumn();

// Fetch all interests
$stmt = $conn->prepare("SELECT * FROM interests");
$stmt->execute();
$all_interests = $stmt->fetchAll();

// Fetch user's selected interests
$stmtUserInterests = $conn->prepare("
    SELECT i.name 
    FROM user_interests ui 
    JOIN interests i ON ui.interest_id = i.id 
    WHERE ui.user_id = ?
");
$stmtUserInterests->execute([$user_id]);
$user_selected_interests = array_column($stmtUserInterests->fetchAll(), 'name');

// Fetch matched table info (if any)
$stmt = $conn->prepare("SELECT * FROM matches WHERE id IN (SELECT match_id FROM match_users WHERE user_id = ?)");
$stmt->execute([$user_id]);
$match = $stmt->fetch();

?>
<?php
include '../partials/greetings.php';

// Extract first name from full name
$fullName = isset($user['name']) ? htmlspecialchars($user['name']) : '';
$firstName = explode(' ', $fullName)[0];

// Default to 'friend' if first name is empty
$name = !empty($firstName) ? $firstName : 'friend';

$greeting = getGreeting() . $name . '.';
?>

<div class="container mt-3">
    <h2 class="display-6 mb-3 mt-3">
        <?php echo $greeting; ?>
    </h2>

    <!-- Display Session Messages -->
    <?php if (isset($_SESSION['success'])): ?>
        <div class="alert alert-success">
            <?php echo htmlspecialchars($_SESSION['success']); ?>
        </div>
        <?php unset($_SESSION['success']); ?>
    <?php endif; ?>
    <?php if (isset($_SESSION['error'])): ?>
        <div class="alert alert-danger">
            <?php echo htmlspecialchars($_SESSION['error']); ?>
        </div>
        <?php unset($_SESSION['error']); ?>
    <?php endif; ?>

    <div class="row">
        <!-- Preferences Card -->
        <div class="col-md-4  mb-3">
            <div class="card">
                <div class="card-body fw-lighter fs-6">
                    <h5 class="card-title">Dinner options</h5>
                    <p>Update your availability and price preference based on existing upcoming matches.</p>
                    <button class="btn btn-secondary mt-3" data-bs-toggle="modal"
                        data-bs-target="#preferencesModal">Edit
                        Preferences</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Matched Card -->
    <div class="row">
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body fw-lighter fs-6">
                    <h5 class="card-title">Preferences</h5>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="themeRadio" id="themeLight" value="light">
                        <label class="form-check-label" for="themeLight">Light</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="themeRadio" id="themeDark" value="dark">
                        <label class="form-check-label" for="themeDark">Dark</label>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function toggleTheme() {
            const body = document.body;
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
        }

        document.addEventListener('DOMContentLoaded', function () {
            // Set initial radio state based on current theme
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            document.getElementById('theme' + currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)).checked = true;

            document.querySelectorAll('input[name="themeRadio"]').forEach(function (radio) {
                radio.addEventListener('change', function () {
                    document.documentElement.setAttribute('data-bs-theme', this.value);

                    // Save theme to DB via AJAX
                    fetch('../handlers/update_theme_handler.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: 'theme=' + encodeURIComponent(this.value)
                    });
                });
            });
        });
    </script>

    <!-- Preferences Modal -->
    <div class="modal fade" id="preferencesModal" tabindex="-1" aria-labelledby="preferencesModalLabel"
        aria-hidden="true">
        <div class="modal-dialog">
            <form action="../handlers/update_preferences_handler.php" method="POST" class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="preferencesModalLabel">Edit Preferences</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <?php
                    require_once '../db.php';
                    $stmt = $conn->prepare("SELECT m.id, m.event_date, m.slot, m.price_point
                                    FROM matches m
                                    WHERE m.event_date >= CURDATE() AND m.approved = 1
                                    ORDER BY m.event_date, FIELD(m.slot, '12:00', '13:00', '14:00', '18:00', '19:00', '20:00')");
                    $stmt->execute();
                    $matches = $stmt->fetchAll();

                    if ($matches): ?>
                        <div class="mb-3">
                            <label for="match_id" class="form-label">Choose your preferred session</label>
                            <select name="match_id" id="match_id" class="form-select" required>
                                <?php foreach ($matches as $match): ?>
                                    <option value="<?= $match['id'] ?>">
                                        <?= htmlspecialchars($match['event_date']) ?> at <?= htmlspecialchars($match['slot']) ?>
                                        (£<?= htmlspecialchars($match['price_point']) ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    <?php else: ?>
                        <p class="text-muted">No upcoming sessions available yet. Please check back later.</p>
                    <?php endif; ?>
                </div>
                <div class="modal-footer d-flex justify-content-start">
                    <button type="submit" class="btn" <?= empty($matches) ? 'disabled' : '' ?>>Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Update Availability -->
    <div class="modal fade" id="updateAvailabilityModal" tabindex="-1" aria-labelledby="updateAvailabilityModalLabel"
        aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content fw-lighter">
                <div class="modal-header">
                    <h5 class="modal-title" id="updateAvailabilityModalLabel">Update Your Availability</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form action="../handlers/availability_handler.php" method="POST">
                        <div class="mb-3">
                            <label for="event_date">Choose a Wednesday:</label>
                            <input type="date" name="event_date" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="slot">Choose a time slot:</label>
                            <select name="slot" class="form-control" required>
                                <option value="12:00">12:00</option>
                                <option value="13:00">13:00</option>
                                <option value="14:00">14:00</option>
                                <option value="18:00">18:00</option>
                                <option value="19:00">19:00</option>
                                <option value="20:00">20:00</option>
                            </select>
                        </div>
                        <button type="submit" class="btn mt-3">Save Availability</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Update Price Point -->
    <div class="modal fade" id="updatePricePointModal" tabindex="-1" aria-labelledby="updatePricePointModalLabel"
        aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content fw-lighter">
                <div class="modal-header">
                    <h5 class="modal-title" id="updatePricePointModalLabel">Update Your Price Point</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form action="../handlers/price_point_handler.php" method="POST">
                        <div class="mb-3">
                            <label for="price_point">Choose a price point:</label>
                            <select name="price_point" class="form-control" required>
                                <option value="£" <?php echo $price_point === '£' ? 'selected' : ''; ?>>£</option>
                                <option value="££" <?php echo $price_point === '££' ? 'selected' : ''; ?>>££</option>
                                <option value="£££" <?php echo $price_point === '£££' ? 'selected' : ''; ?>>£££</option>
                            </select>
                        </div>
                        <button type="submit" class="btn mt-3">Save Price Point</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="personalSummaryModal" tabindex="-1" aria-labelledby="personalSummaryModalLabel"
        aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content fw-lighter">
                <div class="modal-header">
                    <h5 class="modal-title" id="personalSummaryModalLabel">Your Personality Summary</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p><strong>Openness:</strong><br><em>High:</em> Curious, imaginative, open to new experiences,
                        enjoys
                        art and ideas.<br><em>Low:</em> Practical, prefers routine, conservative in views, uncomfortable
                        with change.</p>
                    <p><strong>Conscientiousness:</strong><br><em>High:</em> Organized, responsible, reliable,
                        goal-oriented, plans ahead.<br><em>Low:</em> Spontaneous, careless with details, disorganized,
                        struggles with follow-through.</p>
                    <p><strong>Extraversion:</strong><br><em>High:</em> Outgoing, energetic, talkative, enjoys social
                        settings, assertive.<br><em>Low:</em> Reserved, reflective, prefers solitude, quiet, finds
                        socializing draining.</p>
                    <p><strong>Agreeableness:</strong><br><em>High:</em> Compassionate, cooperative, trusting,
                        empathetic,
                        values getting along.<br><em>Low:</em> Competitive, skeptical, blunt, more focused on
                        self-interest.
                    </p>
                    <p><strong>Neuroticism:</strong><br><em>High:</em> Emotionally reactive, anxious, prone to stress,
                        mood
                        swings.<br><em>Low:</em> Calm, emotionally stable, resilient, handles stress well.</p>
                    <p class="text-muted">Use the radar chart to interpret your scores: <br>0 = Low, 5 = High.</p>
                </div>
            </div>
        </div>
    </div>

    <?php include_once('../partials/footer.php'); ?>