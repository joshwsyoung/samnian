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
?>

<div class="container py-5">
    <div class="text-center mb-4">
        <h1>Your Profile</h1>
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
<?php include_once('../partials/footer.php'); ?>