<?php
session_start();
include_once('../partials/header.php');
include_once('../config.php');
include_once('../db.php');



ini_set('display_errors', 1);
error_reporting(E_ALL);




// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

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

// Fetch OCEAN personality scores
$stmt = $conn->prepare("SELECT * FROM personality_scores WHERE user_id = ?");
$stmt->execute([$user_id]);
$scores = $stmt->fetch();

// If no scores exist, assume they haven't taken the test yet
if (!$scores) {
    $scores = [
        'openness' => 'Not available',
        'conscientiousness' => 'Not available',
        'extraversion' => 'Not available',
        'agreeableness' => 'Not available',
        'neuroticism' => 'Not available'
    ];
}

?>
<?php
include '../partials/greetings.php';
$name = !empty($user['name']) ? htmlspecialchars($user['name']) : 'friend';
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
        <!-- OCEAN Personality Radar -->
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-body fw-lighter fs-6">
                    <h5 class="card-title">OCEAN Personality Test</h5>
                    <?php if (
                        $scores['openness'] !== 'Not available' &&
                        $scores['conscientiousness'] !== 'Not available' &&
                        $scores['extraversion'] !== 'Not available' &&
                        $scores['agreeableness'] !== 'Not available' &&
                        $scores['neuroticism'] !== 'Not available'
                    ): ?>
                        <canvas id="oceanBarChart" width="400" height="300"></canvas>
                        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                        <script>
                            const ctx = document.getElementById('oceanBarChart').getContext('2d');
                            new Chart(ctx, {
                                type: 'bar',
                                data: {
                                    labels: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
                                    datasets: [{
                                        label: 'Score (0–5)',
                                        data: [
                                            <?= $scores['openness'] ?>,
                                            <?= $scores['conscientiousness'] ?>,
                                            <?= $scores['extraversion'] ?>,
                                            <?= $scores['agreeableness'] ?>,
                                            <?= $scores['neuroticism'] ?>
                                        ],
                                        backgroundColor: [
                                            '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f'
                                        ],
                                        borderRadius: 4,
                                        barThickness: 25
                                    }]
                                },
                                options: {
                                    indexAxis: 'y',
                                    responsive: true,
                                    scales: {
                                        x: {
                                            min: 0,
                                            max: 5,
                                            ticks: {
                                                stepSize: 1
                                            },
                                            title: {
                                                display: true,
                                                text: 'Score'
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Traits'
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    return ` ${context.label}: ${context.raw}/5`;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        </script>
                        <button class="btn btn-secondary mt-3" data-bs-toggle="modal"
                            data-bs-target="#personalSummaryModal">Personality summary</button>
                    <?php else: ?>
                        <p>Personality scores not available. Please take the test.</p>
                        <a class="btn btn-secondary mt-3" href="ocean_test.php">Take the test!</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Interests Card -->
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-body fw-lighter fs-6">
                    <div>
                        <h5 class="card-title">My Interests</h5>
                        <?php if (!empty($user_selected_interests)): ?>
                            <ul class="list-unstyled mb-0 small">
                                <?php
                                $max_interests = 7;
                                $interests_to_show = array_slice($user_selected_interests, 0, $max_interests);
                                $more_count = count($user_selected_interests) - $max_interests;
                                foreach ($interests_to_show as $interest): ?>
                                    <li>• <?= htmlspecialchars($interest) ?></li>
                                <?php endforeach; ?>
                                <?php if ($more_count > 0): ?>
                                    <li class="text-muted">+ <?= $more_count ?> more</li>
                                <?php endif; ?>
                            </ul>
                        <?php else: ?>
                            <p class="text-muted">You haven't selected any interests yet.</p>
                        <?php endif; ?>
                    </div>
                    <button class="btn btn-secondary mt-3" data-bs-toggle="modal"
                        data-bs-target="#updateInterestsModal">
                        Edit Preferences
                    </button>
                </div>
            </div>
        </div>
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
    <div class="col-md-12 mb-3">
        <div class="card">
            <div class="card-body fw-lighter fs-6">
                <h5 class="card-title">Your Match</h5>
                <?php if ($match): ?>
                    <p><strong>Matched Table:</strong> Event on <?php echo htmlspecialchars($match['event_date']); ?> at
                        <?php echo htmlspecialchars($match['slot']); ?>.
                    </p>
                <?php else: ?>
                    <p>No matches yet.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>


<!-- Availability Card 
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body fw-lighter fs-6">
                        <h5 class="card-title fw-lighter">Your Availability</h5>
                        <?php if ($availability): ?>
                            <p><strong>Available for:</strong> <?php echo htmlspecialchars($availability[0]['event_date']); ?> at <?php echo htmlspecialchars($availability[0]['slot']); ?></p>
                        <?php else: ?>
                            <p>No availability set yet.</p>
                        <?php endif; ?>
                        <button class="btn mt-3" data-bs-toggle="modal" data-bs-target="#updateAvailabilityModal">Update Availability</button>
                    </div>
                </div>
            </div>

            <!-- Price Point Card 
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-body fw-lighter fs-6">
                        <h5 class="card-title fw-lighter">Your Price Point</h5>
                        <p><strong>Current Price Point:</strong> <?php echo htmlspecialchars($price_point ?: 'Not set'); ?></p>
                        <button class="btn mt-3" data-bs-toggle="modal" data-bs-target="#updatePricePointModal">Update Price Point</button>
                    </div>
                </div>
            </div>
        </div> -->




<!-- Modals -->






<!-- Update interests modal 
    <div class="modal fade" id="updateInterestsModal" tabindex="-1" aria-labelledby="updateInterestsModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content fw-lighter">
                <div class="modal-header">
                    <h5 class="modal-title fw-lighter" id="updateInterestsModalLabel">Update Your Interests</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form action="../handlers/update_interests_handler.php" method="POST">
                        <div class="row">
                            <?php foreach ($all_interests as $interest): ?>
                                <div class="col-md-3 mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input interest" type="checkbox" name="selected_interests[]" value="<?= htmlspecialchars($interest['name']) ?>"
                                            <?= in_array($interest['name'], $user_selected_interests) ? 'checked' : ''; ?>>
                                        <label class="form-check-label" for="interest_<?= htmlspecialchars($interest['id']) ?>">
                                            <?= htmlspecialchars($interest['name']) ?>
                                        </label>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        <button type="submit" class="btn btn-outline-primary mt-3">Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    </div>




    <!-- KK TEST -->
<!-- Interests modal -->
<div class="modal fade" id="updateInterestsModal" tabindex="-1" aria-labelledby="updateInterestsModalLabel"
    aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content fw-lighter">
            <div class="modal-header">
                <h5 class="modal-title" id="updateInterestsModalLabel">Update Your Interests</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form action="../handlers/update_interests_handler.php" method="POST">
                    <div id="interest-cards">
                        <?php foreach ($all_interests as $interest):
                            $isSelected = in_array($interest['name'], $user_selected_interests); ?>
                            <div class="card-option <?= $isSelected ? 'selected' : '' ?>"
                                data-value="<?= htmlspecialchars($interest['name']) ?>">
                                <?= htmlspecialchars($interest['name']) ?>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <input type="hidden" name="selected_interests" id="selectedInterests"
                        value="<?= implode(',', $user_selected_interests) ?>">

                    <button type="submit" class="btn btn-primary mt-3">Save Changes</button>
                </form>
            </div>
        </div>
    </div>
</div>
<!-- Profile Modal -->
<div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="profileModalLabel">Your Profile</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="card">
                    <div class="card-body fw-lighter fs-6">
                        <p><strong>Name:</strong>
                            <?php echo htmlspecialchars($user['name']); ?></p>
                        <p><strong>Email:</strong>
                            <?php echo htmlspecialchars($user['email']); ?></p>
                        <p><strong>Phone:</strong>
                            <?php echo htmlspecialchars($user['phone']); ?></p>
                        <p><strong>City:</strong>
                            <?php echo htmlspecialchars($user['city']); ?></p>
                        <button class="btn btn-secondary mt-3" data-bs-toggle="modal"
                            data-bs-target="#updateProfileModal">
                            Complete Your Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Update profile modal -->
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
                            value="<?php echo isset($user['name']) ? htmlspecialchars($user['name']) : ''; ?>">
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
                    <button type="submit" class="btn mt-3">Save Changes</button>
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



<!-- Preferences Modal -->
<div class="modal fade" id="preferencesModal" tabindex="-1" aria-labelledby="preferencesModalLabel" aria-hidden="true">
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
                <p><strong>Openness:</strong><br><em>High:</em> Curious, imaginative, open to new experiences, enjoys
                    art and ideas.<br><em>Low:</em> Practical, prefers routine, conservative in views, uncomfortable
                    with change.</p>
                <p><strong>Conscientiousness:</strong><br><em>High:</em> Organized, responsible, reliable,
                    goal-oriented, plans ahead.<br><em>Low:</em> Spontaneous, careless with details, disorganized,
                    struggles with follow-through.</p>
                <p><strong>Extraversion:</strong><br><em>High:</em> Outgoing, energetic, talkative, enjoys social
                    settings, assertive.<br><em>Low:</em> Reserved, reflective, prefers solitude, quiet, finds
                    socializing draining.</p>
                <p><strong>Agreeableness:</strong><br><em>High:</em> Compassionate, cooperative, trusting, empathetic,
                    values getting along.<br><em>Low:</em> Competitive, skeptical, blunt, more focused on self-interest.
                </p>
                <p><strong>Neuroticism:</strong><br><em>High:</em> Emotionally reactive, anxious, prone to stress, mood
                    swings.<br><em>Low:</em> Calm, emotionally stable, resilient, handles stress well.</p>
                <p class="text-muted">Use the radar chart to interpret your scores: <br>0 = Low, 5 = High.</p>
            </div>
        </div>
    </div>
</div>

<?php include_once('../partials/footer.php'); ?>