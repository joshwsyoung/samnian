<?php 

session_start();
require_once('../config.php');
require_once('../db.php');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ' . BASE_URL . '/admin/login.php');
    exit;
}

include_once('../partials/header.php');
?>

<div class="container mt-4">
    <h2>Matches</h2>

    <!-- Add Match Button -->
    <a href="create_match.php" class="btn btn-success mb-3">Add Match</a>

    <table class="table table-bordered mt-3">
        <thead class="thead-light">
            <tr>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Price Point</th>
                <th># Users</th>
                <th>Approved</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $stmt = $conn->query("SELECT m.*, 
                (SELECT COUNT(*) FROM match_users WHERE match_id = m.id) as user_count 
                FROM matches m ORDER BY m.event_date DESC, FIELD(slot, '12:00','13:00','14:00','18:00','19:00','20:00')");
            
            while ($match = $stmt->fetch()):
                $match_id = $match['id'];
                
                // Get the users associated with the current match
                $user_stmt = $conn->prepare("SELECT u.id, u.name FROM users u
                    JOIN match_users mu ON u.id = mu.user_id
                    WHERE mu.match_id = ?");
                $user_stmt->execute([$match_id]);
                $users = $user_stmt->fetchAll();

                // Check if a conversation already exists for this match
                $conv_stmt = $conn->prepare("SELECT id FROM conversations WHERE match_id = ?");
                $conv_stmt->execute([$match_id]);
                $conversation = $conv_stmt->fetch();

                // If a conversation exists, link to it
                if ($conversation) {
                    $conversation_id = $conversation['id'];
                    $conversation_link = BASE_URL . "/public/messages.php?conversation_id=" . $conversation_id;
                } else {
                    $conversation_link = null;
                }
            ?>
                <tr>
                    <td><?= htmlspecialchars($match['event_date']) ?></td>
                    <td><?= htmlspecialchars($match['slot']) ?></td>
                    <td><?= htmlspecialchars($match['price_point']) ?></td>
                    <td><?= $match['user_count'] ?></td>
                    <td><?= $match['approved'] ? '✅' : '❌' ?></td>
                    <td>
                        <a href="edit_match.php?id=<?= $match['id'] ?>" class="btn btn-sm btn-primary">Edit</a>

                        <!-- Create or Link to Conversation Button -->
                        <?php if ($match['approved']): ?>
                            <?php if ($conversation_link): ?>
                                <a href="<?= $conversation_link ?>" class="btn btn-sm btn-info">Go to Conversation</a>
                            <?php else: ?>
                                <form action="<?= BASE_URL ?>/handlers/create_conversation.php" method="POST" class="d-inline">
                                    <input type="hidden" name="title" value="Your title">
                                    <input type="hidden" name="match_id" value="<?= $match['id'] ?>">

                                    <?php foreach ($users as $user): ?>
                                        <input type="hidden" name="users[]" value="<?= $user['id'] ?>">
                                    <?php endforeach; ?>

                                    <button type="submit" class="btn btn-sm btn-success mt-2">Create Conversation</button>
                                </form>
                            <?php endif; ?>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
</div>

<?php include_once('../partials/footer.php'); ?>
