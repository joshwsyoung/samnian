<?php
session_start();
include_once('../config.php');
include_once('../db.php');


// Logging (optional)
$debug_log_file = __DIR__ . '/../debug/ocean_test_log.txt';
file_put_contents($debug_log_file, "===== NEW SUBMISSION =====\n", FILE_APPEND);

if (!isset($_SESSION['user_id'])) {
    header('Location: ../public/login.php');
    exit;
}

$user_id = $_SESSION['user_id'];

// Initialize trait buckets
$scores = [
    'O' => ['sum' => 0, 'count' => 0],
    'C' => ['sum' => 0, 'count' => 0],
    'E' => ['sum' => 0, 'count' => 0],
    'A' => ['sum' => 0, 'count' => 0],
    'N' => ['sum' => 0, 'count' => 0]
];

$stmt = $conn->prepare("SELECT id, trait, reverse FROM personality_tests WHERE required = 1");
$stmt->execute();
$questions = $stmt->fetchAll();

foreach ($questions as $question) {
    $qid = $question['id'];
    $trait = $question['trait'];
    $reverse = $question['reverse'];
    $key = 'question_' . $qid;
    $answer = $_POST[$key] ?? null;

    file_put_contents($debug_log_file, "QID $qid ($trait): Raw Answer = " . print_r($answer, true), FILE_APPEND);

    if ($answer !== null && isset($scores[$trait])) {
        if ($reverse) {
            $answer = is_array($answer) ? array_map(fn($val) => 6 - $val, $answer) : (6 - $answer);
        }

        $score = is_array($answer) ? array_sum($answer) : $answer;
        $scores[$trait]['sum'] += $score;
        $scores[$trait]['count']++;

        file_put_contents($debug_log_file, " → Processed = $score\n", FILE_APPEND);
    } else {
        file_put_contents($debug_log_file, " → Skipped / Invalid\n", FILE_APPEND);
    }
}

// Compute per-trait averages
$O = $scores['O']['count'] ? $scores['O']['sum'] / $scores['O']['count'] : 0;
$C = $scores['C']['count'] ? $scores['C']['sum'] / $scores['C']['count'] : 0;
$E = $scores['E']['count'] ? $scores['E']['sum'] / $scores['E']['count'] : 0;
$A = $scores['A']['count'] ? $scores['A']['sum'] / $scores['A']['count'] : 0;
$N = $scores['N']['count'] ? $scores['N']['sum'] / $scores['N']['count'] : 0;

file_put_contents($debug_log_file, "Final Scores: O=$O C=$C E=$E A=$A N=$N\n", FILE_APPEND);

// Save to DB
$stmt = $conn->prepare("INSERT INTO personality_scores (user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    openness = VALUES(openness), 
    conscientiousness = VALUES(conscientiousness), 
    extraversion = VALUES(extraversion), 
    agreeableness = VALUES(agreeableness), 
    neuroticism = VALUES(neuroticism)");
$stmt->execute([$user_id, $O, $C, $E, $A, $N]);

header('Location: ../public/dashboard.php');
exit;
