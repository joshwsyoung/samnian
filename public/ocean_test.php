<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

include_once('../partials/header.php');
include_once('../config.php');
include_once('../db.php');

$user_id = $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT * FROM personality_tests WHERE required = 1 AND active = 1 ORDER BY id ASC");
$stmt->execute();
$questions = $stmt->fetchAll();

if (empty($questions)) {
    echo "<div class='alert alert-danger'>No questions available for the test.</div>";
    exit;
}
?>

<div class="container">
    <div class="top mt-5">
        <h2 class="mb-4 fw-lighter text-center">OCEAN Personality Test</h2>

        <!-- Progress Bar -->
        <div id="progressBarContainer" class="mb-4">
            <div class="progress">
                <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"
                    style="width: 0%;"></div>
            </div>
        </div>

        <form id="oceanForm" action="../handlers/ocean_test_handler.php" method="POST">
            <?php foreach ($questions as $index => $question): ?>
                <div class="question-block mb-5" style="<?= $index === 0 ? '' : 'display:none;' ?>"
                    data-index="<?= $index ?>">
                    <p class="lead fw-lighter text-center mb-3"><?= htmlspecialchars($question['question']) ?></p>

                    <?php $options = json_decode($question['options'], true); ?>
                    <div class="btn-group d-flex justify-content-center" role="group" aria-label="Options">
                        <?php foreach ($options as $option):
                            $inputId = 'q' . $question['id'] . '_' . $option['value'];
                            ?>
                            <input type="radio" class="btn-check" name="question_<?= $question['id'] ?>" id="<?= $inputId ?>"
                                value="<?= $option['value'] ?>" required>
                            <label class="btn" for="<?= $inputId ?>">
                                <?= htmlspecialchars($option['label']) ?>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>

            <div id="submitBtnContainer" style="display:none;" class="mt-4 text-center">
                <button type="submit" class="btn btn-primary">Submit Test</button>
            </div>
        </form>
    </div>
</div>

<script>
    const questions = document.querySelectorAll('.question-block');
    const total = questions.length;
    const progressBar = document.querySelector('.progress-bar');
    const submitBtnContainer = document.getElementById('submitBtnContainer');
    let current = 0;

    questions.forEach((question, index) => {
        const radioButtons = question.querySelectorAll('input[type="radio"]');

        radioButtons.forEach(radioButton => {
            radioButton.addEventListener('change', () => {
                question.style.display = 'none';
                current++;

                if (current < total) {
                    questions[current].style.display = 'block';
                } else {
                    submitBtnContainer.style.display = 'block';
                }

                const percent = Math.round((current / total) * 100);
                progressBar.style.width = percent + '%';
            });
        });
    });
</script>

<?php include_once('../partials/footer.php'); ?>