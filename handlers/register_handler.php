<?php

include_once(__DIR__ . '/../config.php');

// Show PHP errors only in debug mode
if (defined('APP_DEBUG') && APP_DEBUG) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

include_once(__DIR__ . '/../db.php');
include_once(__DIR__ . '/../handlers/mailer.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? null;
    $email = $_POST['email'] ?? null;
    $phone = $_POST['phone'] ?? null;
    $city = $_POST['city'] ?? null;
    $age = isset($_POST['age']) ? (int) $_POST['age'] : null;
    $password = $_POST['password'] ?? null;

    $line_1 = $_POST['line_1'] ?? '';
    $line_2 = $_POST['line_2'] ?? '';
    $line_3 = $_POST['line_3'] ?? '';
    $town_or_city = $_POST['town_or_city'] ?? '';
    $county = $_POST['county'] ?? '';
    $postcode = $_POST['postcode-final'] ?? '';
    $formatted_address = $_POST['formatted_address'] ?? '';

    $interestsRaw = $_POST['interests'] ?? '';
    $interests = is_array($interestsRaw) ? $interestsRaw : explode(',', $interestsRaw);

    if (!$email || !$phone || !$password) {
        header('Location: ' . BASE_URL . '/public/register.php?error=missing_fields');
        exit;
    }

    try {
        $stmt = $conn->prepare("SELECT id, verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            if ($user['verified'] == 0) {
                $stmt = $conn->prepare("SELECT code FROM email_verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$email]);
                $row = $stmt->fetch();

                if ($row) {
                    $code = $row['code'];

                    $subject = 'Your TableTalk Verification Code';
                    $body = "
                        <div style='font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto;'>
                            <h2 style='color: #234654;'>Verify Your Email</h2>
                            <p style='font-size: 16px; color: #333;'>Hi there! 👋</p>
                            <p style='font-size: 16px; color: #333;'>Your TableTalk verification code is:</p>
                            <p style='font-size: 32px; font-weight: bold; color: #234654; margin: 20px 0;'>$code</p>
                            <p style='font-size: 14px; color: #666;'>Please enter this code on the website to complete your registration.</p>
                            <hr style='margin: 30px 0;'>
                            <p style='font-size: 12px; color: #aaa;'>If you didn’t sign up for TableTalk, you can safely ignore this email.</p>
                        </div>
                    ";

                    sendEmail($email, $subject, $body);

                    header('Location: ' . BASE_URL . '/public/verify_email.php?email=' . urlencode($email));
                    exit;
                }
            } else {
                header('Location: ' . BASE_URL . '/public/register.php?error=already_registered');
                exit;
            }
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(16));

        $stmt = $conn->prepare("
            INSERT INTO users (name, email, phone, age, city, password_hash, verification_token, verified, line_1, line_2, line_3, town_or_city, county, postcode, formatted_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $name,
            $email,
            $phone,
            $age,
            $city,
            $passwordHash,
            $token,
            $line_1,
            $line_2,
            $line_3,
            $town_or_city,
            $county,
            $postcode,
            $formatted_address
        ]);

        $userId = $conn->lastInsertId();

        if (!empty($interests)) {
            $stmt = $conn->prepare("INSERT INTO user_interests (user_id, interest_id) VALUES (?, ?)");
            foreach ($interests as $interestId) {
                if (is_numeric($interestId)) {
                    $stmt->execute([$userId, (int) $interestId]);
                }
            }
        }

        $code = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $stmt = $conn->prepare("INSERT INTO email_verification_codes (email, code) VALUES (?, ?)");
        $stmt->execute([$email, $code]);

        $subject = 'Your TableTalk Verification Code';
        $body = "
            <div style='font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto;'>
                <h2 style='color: #234654;'>Verify Your Email</h2>
                <p style='font-size: 16px; color: #333;'>Hi there! 👋</p>
                <p style='font-size: 16px; color: #333;'>Your TableTalk verification code is:</p>
                <p style='font-size: 32px; font-weight: bold; color: #234654; margin: 20px 0;'>$code</p>
                <p style='font-size: 14px; color: #666;'>Please enter this code on the website to complete your registration.</p>
                <hr style='margin: 30px 0;'>
                <p style='font-size: 12px; color: #aaa;'>If you didn’t sign up for TableTalk, you can safely ignore this email.</p>
            </div>
        ";

        sendEmail($email, $subject, $body);

        header('Location: ' . BASE_URL . '/public/verify_email.php?email=' . urlencode($email));
        exit;

    } catch (PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        if (defined('APP_DEBUG') && APP_DEBUG) {
            echo "Error: " . $e->getMessage();
        } else {
            header('Location: ' . BASE_URL . '/public/register.php?error=server');
        }
        exit;
    }
}
