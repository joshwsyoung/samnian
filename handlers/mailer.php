<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once(__DIR__ . '/../assets/phpmailer/PHPMailer.php');
require_once(__DIR__ . '/../assets/phpmailer/SMTP.php');
require_once(__DIR__ . '/../assets/phpmailer/Exception.php');

function sendEmail($email, $subject, $body) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'unable.to.reply.to.this@gmail.com';
        $mail->Password   = 'mbpz dkwt zopz ftzt';
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        $mail->setFrom('unable.to.reply.to.this@gmail.com', 'TableTalk');
        $mail->addAddress($email); // recipient email

        $mail->isHTML(true); // Set email format to HTML
        $mail->Subject = $subject; // Subject of the email
        $mail->Body    = $body; // Body of the email

        $mail->send(); // Send the email
    } catch (Exception $e) {
        error_log("Email send failed: " . $mail->ErrorInfo);
    }
}