<?php
session_start();
require_once '../config.php';
require_once '../db.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: " . BASE_URL . "/public/login.php");
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch conversations this user is part of
$stmt = $conn->prepare("
    SELECT c.id, c.name 
    FROM conversations c
    JOIN conversation_users cu ON c.id = cu.conversation_id
    WHERE cu.user_id = ?
    ORDER BY c.created_at DESC
");
$stmt->execute([$user_id]);
$conversations = $stmt->fetchAll();

include '../partials/header.php';
?>

<div class="container mt-4">
    <h3>My Conversations</h3>
    <div class="row">
        <div class="col-md-4">
            <ul class="list-group mb-3">
                <?php if (count($conversations) === 0): ?>
                    <li class="list-group-item">No conversations yet.</li>
                <?php else: ?>
                    <?php foreach ($conversations as $conv): ?>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <a href="?conversation_id=<?= $conv['id'] ?>" class="text-decoration-none"><?= htmlspecialchars($conv['name']) ?></a>
                        </li>
                    <?php endforeach; ?>
                <?php endif; ?>
            </ul>

            <form method="POST" action="<?= BASE_URL ?>/handlers/messages_handler.php">
                <div class="mb-2">
                    <input type="text" name="conversation_name" class="form-control" placeholder="New conversation name..." required>
                </div>
                <button type="submit" name="create_conversation" class="btn btn-sm btn-success w-100">Start New Conversation</button>
            </form>
        </div>

        <div class="col-md-8">
            <?php if (isset($_GET['conversation_id'])): 
                $conversation_id = (int)$_GET['conversation_id'];

                // Check user is part of this conversation
                $check = $conn->prepare("SELECT 1 FROM conversation_users WHERE conversation_id = ? AND user_id = ?");
                $check->execute([$conversation_id, $user_id]);
                if ($check->rowCount() === 0) {
                    echo "<div class='alert alert-danger'>Access denied.</div>";
                    include '../partials/footer.php';
                    exit;
                }
            ?>
            <div id="chat-box" class="border p-3 mb-3" style="height: 400px; overflow-y: scroll; background: #f8f9fa;">
                <!-- Messages will be loaded here by JS -->
            </div>
            <form method="POST" action="<?= BASE_URL ?>/handlers/messages_handler.php">
                <input type="hidden" name="conversation_id" value="<?= $conversation_id ?>">
                <div class="input-group">
                    <input type="text" name="message" class="form-control" placeholder="Type a message..." required>
                    <button class="btn btn-primary" type="submit">Send</button>
                </div>
            </form>
            <script>
                function fetchMessages() {
                    fetch("<?= BASE_URL ?>/handlers/messages_handler.php?conversation_id=<?= $conversation_id ?>")
                        .then(res => res.text())
                        .then(html => {
                            document.getElementById('chat-box').innerHTML = html;
                            const box = document.getElementById('chat-box');
                            box.scrollTop = box.scrollHeight;
                        });
                }
                setInterval(fetchMessages, 2000);
                fetchMessages();
            </script>
            <?php else: ?>
                <div class="alert alert-info">Select or start a conversation to begin chatting.</div>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php include '../partials/footer.php'; ?>
