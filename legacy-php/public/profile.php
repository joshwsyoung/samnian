<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
include_once('../config.php');
include_once('../db.php');
include_once('../partials/auth_check.php');
include_once('../partials/header.php');
include '../partials/greetings.php';

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

// Place greeting code here!
$fullName = isset($user['name']) ? htmlspecialchars($user['name']) : '';
$firstName = explode(' ', $fullName)[0];
$name = !empty($firstName) ? $firstName : 'friend';
$greeting = getGreeting() . $name . '.';

// List all required fields
$required_fields = ['name', 'email', 'phone', 'age', 'city', 'price_point', 'profile_image'];
$profile_complete = true;
foreach ($required_fields as $field) {
    if (empty($user[$field])) {
        $profile_complete = false;
        break;
    }
}

// Fetch OCEAN personality scores
$stmt = $conn->prepare("SELECT * FROM personality_scores WHERE user_id = ?");
$stmt->execute([$user_id]);
$scores = $stmt->fetch();

if (!$scores) {
    $scores = [
        'openness' => 'Not available',
        'conscientiousness' => 'Not available',
        'extraversion' => 'Not available',
        'agreeableness' => 'Not available',
        'neuroticism' => 'Not available'
    ];
}

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

<div class="container py-5">
    <div class="text-center mb-4">
        <h2 class="display-6 mb-3 mt-3">
            <?php echo $greeting; ?>
        </h2>
        <p class="text-muted">Here’s what we’ve got on file for you.</p>
    </div>

    <?php if (isset($_SESSION['success'])): ?>
        <div class="alert alert-success">
            <?= htmlspecialchars($_SESSION['success']); ?>
        </div>
        <?php unset($_SESSION['success']); ?>
    <?php endif; ?>
    <?php if (isset($_SESSION['error'])): ?>
        <div class="alert alert-danger">
            <?= htmlspecialchars($_SESSION['error']); ?>
        </div>
        <?php unset($_SESSION['error']); ?>
    <?php endif; ?>

    <div class="row justify-content-center">
        <!-- Left Column: Profile Image + Name -->
        <div class="col-md-4 text-center mb-4">
            <div class="card shadow-sm p-3">
                <?php if (!empty($user['profile_image'])): ?>
                    <img src="../uploads/<?= htmlspecialchars($user['profile_image']) ?>"
                        class="rounded-circle mb-3 d-block mx-auto profile-image" alt="Profile Image">
                <?php endif; ?>
                <h5 class="fw-semibold fs-3"><?= htmlspecialchars($user['name'] ?? '') ?></h5>
                <div class="row">
                    <div class="col-6">
                        <a class="btn btn-secondary mt-3 w-100" href="messages.php">
                            <i class="bi bi-chat"></i>
                            Chats
                        </a>
                    </div>
                    <div class="col-6">
                        <a class="btn btn-secondary mt-3 w-100" data-bs-toggle="modal"
                            data-bs-target="#updateProfileModal">
                            <i class="bi bi-pencil-square"></i>
                            Edit Profile
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Column: Full Profile Info -->
        <div class="col-md-8">
            <div class="card shadow-sm p-4">
                <p><strong>Email:</strong> <?= htmlspecialchars($user['email'] ?? '') ?></p>
                <p><strong>Phone:</strong> <?= htmlspecialchars($user['phone'] ?? '') ?></p>
                <p><strong>Age:</strong> <?= htmlspecialchars($user['age'] ?? '') ?></p>
                <p><strong>City:</strong> <?= htmlspecialchars($user['city'] ?? '') ?></p>
                <p><strong>Price Point:</strong> <?= htmlspecialchars($user['price_point'] ?? '') ?></p>

                <?php if (!$profile_complete): ?>
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-secondary mt-3 w-auto" data-bs-toggle="modal"
                            data-bs-target="#updateProfileModal">
                            Complete Your Profile
                        </button>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <!-- Interests Card -->
    <div class="row">
        <div class="col-md-6 mt-3">
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
        <div class="col-md-6 mt-3">
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

    <!-- OCEAN Personality Test Results -->
    <div class="card personality-card mt-3 mb-4">
        <div class="card-body">
            <div class="row mb-2">
                <div class="col">
                    <h5 class="card-title">OCEAN Personality Test</h5>
                </div>
                <div class="col-auto">
                    <button class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#personalSummaryModal">
                        <i class="bi bi-info-circle"></i>
                    </button>
                </div>
            </div>
            <?php if (
                $scores['openness'] !== 'Not available' &&
                $scores['conscientiousness'] !== 'Not available' &&
                $scores['extraversion'] !== 'Not available' &&
                $scores['agreeableness'] !== 'Not available' &&
                $scores['neuroticism'] !== 'Not available'
            ): ?>
                <div class="chart-responsive oceanBarChartProfile">
                    <canvas id="oceanBarChartProfile"></canvas>
                </div>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script>
                    const ctxProfile = document.getElementById('oceanBarChartProfile').getContext('2d');
                    new Chart(ctxProfile, {
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
                                barThickness: 25,
                                barPercentage: 0.6,
                                categoryPercentage: 0.6
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
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
            <?php else: ?>
                <p>Personality scores not available. Please take the test.</p>
                <a class="btn btn-secondary mt-3" href="ocean_test.php">Take the test!</a>
            <?php endif; ?>

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
                <form action="../handlers/update_profile_handler.php" method="POST" enctype="multipart/form-data">
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
                            value="<?= isset($user['phone']) ? htmlspecialchars($user['phone']) : '' ?>" required
                            placeholder="">
                    </div>
                    <div class="mb-3">
                        <label for="age">Age</label>
                        <input type="number" class="form-control" name="age"
                            value="<?= htmlspecialchars($user['age']) ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="city">City</label>
                        <select class="form-select" name="city" required>
                            <option value="" disabled <?= empty($user['city']) ? 'selected' : '' ?>>Select City</option>
                            <?php
                            $cities = ['Marlow', 'London', 'Bristol', 'Durban SA'];
                            foreach ($cities as $city) {
                                $selected = ($user['city'] === $city) ? 'selected' : '';
                                echo "<option value=\"$city\" $selected>$city</option>";
                            }
                            ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="price_point">Preferred Price Point</label>
                        <select class="form-select" name="price_point" required>
                            <?php
                            $levels = ['£', '££', '£££'];
                            foreach ($levels as $level) {
                                $selected = ($user['price_point'] === $level) ? 'selected' : '';
                                echo "<option value=\"$level\" $selected>$level</option>";
                            }
                            ?>
                        </select>
                    </div>

                    <div class="card-body fw-lighter fs-6">
                        <h5 class="card-title">Theme</h5>
                        <div class="form-check form-check-inline mb-3">
                            <input class="form-check-input" type="radio" name="themeRadio" id="themeLight"
                                value="light">
                            <label class="form-check-label" for="themeLight">Light</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="themeRadio" id="themeDark" value="dark">
                            <label class="form-check-label" for="themeDark">Dark</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="profile_image">Profile Image</label>
                        <input type="file" name="profile_image" class="form-control" accept="image/*">
                        <?php if (!empty($user['profile_image'])): ?>
                            <img src="../uploads/<?= htmlspecialchars($user['profile_image']) ?>" alt="Profile Image"
                                class="img-thumbnail mt-2" style="max-width: 100px;">
                        <?php endif; ?>
                    </div>
                    <button type="submit" class="btn btn-secondary mt-3">Save Changes</button>
                </form>
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
                        document.getElementById('theme' + currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)).checked
                            = true;

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

<!-- Personality Summary Modal -->
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

<!-- Interests Modal -->
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

<?php include_once('../partials/footer.php'); ?>