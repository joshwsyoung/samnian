<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once(__DIR__ . '/../assets/phpmailer/PHPMailer.php');
require_once(__DIR__ . '/../assets/phpmailer/SMTP.php');
require_once(__DIR__ . '/../assets/phpmailer/Exception.php');
require_once(__DIR__ . '/../config.php');

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

        // Disable SSL checks only in debug/dev mode
        if (defined('APP_DEBUG') && APP_DEBUG) {
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                    'allow_self_signed' => true,
                ],
            ];
        }

        $mail->setFrom('unable.to.reply.to.this@gmail.com', 'TableTalk');
        $mail->addAddress($email);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
    } catch (Exception $e) {
        error_log("Email send failed: " . $mail->ErrorInfo);
        if (defined('APP_DEBUG') && APP_DEBUG) {
            file_put_contents(__DIR__ . '/email_debug.log', "Error: " . $mail->ErrorInfo . "\n", FILE_APPEND);
        }
    }
}
