<?php
session_start();
require_once '../config.php';
require_once '../db.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: " . BASE_URL . "/public/login.php");
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch user's conversations
$stmt = $conn->prepare("
    SELECT c.id, c.title
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
    <div class="d-flex justify-content-between align-items-center mb-3">
        <button class="btn" data-bs-toggle="offcanvas" data-bs-target="#chatList">Chats</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-toggle="modal"
            data-bs-target="#conversationInfoModal">
            <i class="bi bi-info-circle"></i>
        </button>
    </div>

    <div class="row">

        <!-- Viewing all conversations and checking who is invited -->
        <div class="offcanvas offcanvas-start" tabindex="-1" id="chatList">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">Conversations</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <?php
                $stmt = $conn->prepare("
                    SELECT c.id, c.title, cu.status
                    FROM conversations c
                    LEFT JOIN conversation_users cu ON c.id = cu.conversation_id
                    WHERE cu.user_id = ? AND (cu.status = 'accepted' OR cu.status = 'pending')
                    ORDER BY c.created_at DESC
                ");
                $stmt->execute([$user_id]);
                $conversations = $stmt->fetchAll();
                ?>

                <?php if (empty($conversations)): ?>
                    <div class="alert alert-info">No conversations yet.</div>
                <?php else: ?>
                    <div class="list-group">
                        <?php foreach ($conversations as $c): ?>
                            <?php
                            $stmt = $conn->prepare("
                                SELECT m.message, m.sent_at
                                FROM chat_messages m
                                WHERE m.conversation_id = ?
                                ORDER BY m.sent_at DESC 
                            ");
                            $stmt->execute([$c['id']]);
                            $last_message = $stmt->fetch();
                            $last_message_text = $last_message ? htmlspecialchars($last_message['message']) : '';
                            $last_message_time = $last_message ? date('H:i', strtotime($last_message['sent_at'])) : '';
                            ?>

                            <div
                                class="list-group-item <?= isset($_GET['conversation_id']) && $_GET['conversation_id'] == $c['id'] ? 'active' : '' ?>">
                                <div class="d-flex justify-content-between align-items-center">
                                    <a href="?conversation_id=<?= $c['id'] ?>"
                                        class="fw-bold text-decoration-none text-reset flex-grow-1">
                                        <?= htmlspecialchars($c['title']) ?>
                                        <?php if ($c['status'] === 'pending'): ?>
                                            <span class="badge bg-warning text-dark ms-2">Pending</span>
                                        <?php endif; ?>
                                    </a>
                                    <small class="text-muted"><?= $last_message_time ?></small>
                                </div>
                                <div class="text-truncate mb-2"><?= $last_message_text ?></div>

                                <?php if ($c['status'] === 'pending'): ?>
                                    <form action="<?= BASE_URL ?>/handlers/invite_decision_handler.php" method="post"
                                        class="d-flex gap-2">
                                        <input type="hidden" name="conversation_id" value="<?= $c['id'] ?>">
                                        <button type="submit" name="decision" value="accepted"
                                            class="btn btn-sm btn-success">Accept</button>
                                        <button type="submit" name="decision" value="declined"
                                            class="btn btn-sm btn-danger">Decline</button>
                                    </form>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>

                <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#createConversationModal">
                    Create New Conversation
                </button>
            </div>
        </div>

        <!-- Modal for creating a new conversation -->
        <div class="modal fade" id="createConversationModal" tabindex="-1"
            aria-labelledby="createConversationModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="createConversationModalLabel">Create a New Conversation</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form action="<?= BASE_URL ?>/handlers/create_conversation.php" method="POST">
                            <div class="mb-3">
                                <label for="conversationTitle" class="form-label">Conversation Title</label>
                                <input type="text" class="form-control" id="conversationTitle" name="title" required>
                            </div>

                            <div class="mb-3">
                                <label for="users" class="form-label">Add Users</label>
                                <select class="form-select" id="users" name="users[]" required>
                                    <?php
                                    $stmt = $conn->prepare("SELECT id, name FROM users");
                                    $stmt->execute();
                                    $users = $stmt->fetchAll();
                                    foreach ($users as $user): ?>
                                        <option value="<?= $user['id'] ?>"><?= htmlspecialchars($user['name']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="modal-footer">
                                <button type="submit" class="btn btn-primary">Create Conversation</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Panel -->
        <div class="col-md-8">
            <?php if (isset($_GET['conversation_id'])):
                $conversation_id = (int) $_GET['conversation_id'];

                $stmt = $conn->prepare("SELECT * FROM conversation_users WHERE conversation_id = ? AND user_id = ?");
                $stmt->execute([$conversation_id, $user_id]);
                if ($stmt->rowCount() === 0) {
                    echo "<div class='alert alert-info'>You don't have access to this chat. Start a new one <a data-bs-toggle='modal' data-bs-target='#createConversationModal'>here.</a></div>";
                    include '../partials/footer.php';
                    exit;
                }

                $stmt = $conn->prepare("
                    SELECT m.user_id, m.message, m.sent_at, u.id AS id
                    FROM chat_messages m
                    JOIN users u ON m.user_id = u.id
                    WHERE m.conversation_id = ?
                    ORDER BY m.sent_at ASC
                ");
                $stmt->execute([$conversation_id]);
                $messages = $stmt->fetchAll();

                if (isset($conversation_id)) {
                    $stmt = $conn->prepare("SELECT user_id FROM conversations WHERE id = ?");
                    $stmt->execute([$conversation_id]);
                    $conversation_owner_id = $stmt->fetchColumn();

                    $stmt = $conn->prepare("
                        SELECT u.id, u.name, cu.status
                        FROM conversation_users cu
                        JOIN users u ON cu.user_id = u.id
                        WHERE cu.conversation_id = ?
                    ");
                    $stmt->execute([$conversation_id]);
                    $participants = $stmt->fetchAll();
                }
                ?>

                <?php if (isset($participants)): ?>
                    <div class="modal fade" id="conversationInfoModal" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Participants</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                </div>
                                <div class="modal-body">
                                    <?php foreach ($participants as $p): ?>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span
                                                class="badge bg-<?= $p['status'] === 'confirmed' ? 'success' : 'warning text-dark' ?>">
                                                <?= htmlspecialchars($p['name']) ?> (<?= $p['status'] ?>)
                                            </span>
                                            <?php if ($p['id'] != $conversation_owner_id): ?>
                                                <form method="POST" action="<?= BASE_URL ?>/handlers/remove_user_handler.php"
                                                    class="ms-2">
                                                    <input type="hidden" name="conversation_id" value="<?= $conversation_id ?>">
                                                    <input type="hidden" name="user_id" value="<?= $p['id'] ?>">
                                                    <button type="submit" class="btn btn-sm btn-outline-danger">
                                                        <?= ($p['id'] == $user_id) ? 'Leave' : 'Remove'; ?>
                                                    </button>
                                                </form>
                                            <?php endif; ?>
                                        </div>
                                    <?php endforeach; ?>

                                    <?php if ($conversation_owner_id == $user_id): ?>
                                        <button type="button" class="btn btn-sm btn-outline-danger" data-bs-toggle="modal"
                                            data-bs-target="#deleteConfirmationModal">
                                            Delete Chat
                                        </button>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal fade" id="deleteConfirmationModal" tabindex="-1"
                        aria-labelledby="deleteConfirmationModalLabel" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="deleteConfirmationModalLabel">Confirm Deletion</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    Are you sure you want to delete this chat? This action cannot be undone.
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <form method="POST" action="<?= BASE_URL ?>/handlers/delete_conversation_handler.php"
                                        class="d-inline">
                                        <input type="hidden" name="conversation_id" value="<?= $conversation_id ?>">
                                        <button type="submit" class="btn btn-danger">Delete Chat</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>

                <?php
                $stmt = $conn->prepare("
                SELECT m.sender_id, m.message, m.sent_at, u.id AS user_id, u.name AS user_name
                FROM chat_messages m
                LEFT JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.sent_at ASC
            ");
                $stmt->execute([$conversation_id]);
                $messages = $stmt->fetchAll();
                ?>

                <div id="chat-box" class="border p-3 bg-light mb-3" style="height: 400px; overflow-y: auto;">
                    <?php if (empty($messages)): ?>
                        <p class="text-muted">No messages yet. Start the conversation.</p>
                    <?php else: ?>
                        <?php foreach ($messages as $msg): ?>
                            <div
                                class="d-flex <?= $msg['sender_id'] == $user_id ? 'justify-content-end' : 'justify-content-start' ?>">
                                <div class="mb-2 px-3 py-2 rounded <?= $msg['sender_id'] == $user_id ? 'bg-primary text-white' : 'bg-white border' ?>"
                                    style="max-width: 75%;">
                                    <div class="small fw-bold"><?= htmlspecialchars($msg['user_name']) ?></div>
                                    <div><?= nl2br(htmlspecialchars($msg['message'])) ?></div>
                                    <div class="small text-muted text-end"><?= date('H:i', strtotime($msg['sent_at'])) ?></div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <form method="POST" action="<?= BASE_URL ?>/handlers/send_message_handler.php" class="mb-3">
                    <input type="hidden" name="conversation_id" value="<?= $conversation_id ?>">
                    <div class="input-group">
                        <input type="text" name="message" class="form-control" placeholder="Type a message..." required>
                        <button class="btn btn-primary" type="submit">Send</button>
                    </div>
                </form>

                <button class="btn btn-outline-success mb-3" data-bs-toggle="modal" data-bs-target="#inviteModal">+ Invite
                    User</button>

                <div class="modal fade" id="inviteModal" tabindex="-1">
                    <div class="modal-dialog">
                        <form method="POST" action="<?= BASE_URL ?>/handlers/invite_user_handler.php" class="modal-content">
                            <input type="hidden" name="conversation_id" value="<?= $conversation_id ?>">
                            <div class="modal-header">
                                <h5 class="modal-title">Invite User</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <label for="invite_user_id">Select User:</label>
                                <select name="invite_user_id" class="form-select" required>
                                    <?php
                                    $stmt = $conn->prepare("
                                    SELECT u.id, u.name
                                    FROM users u
                                    WHERE u.id != ? AND NOT EXISTS (
                                        SELECT * FROM conversation_users cu
                                        WHERE cu.conversation_id = ? AND cu.user_id = u.id
                                    )
                                ");
                                    $stmt->execute([$user_id, $conversation_id]);
                                    $users = $stmt->fetchAll();
                                    foreach ($users as $user): ?>
                                        <option value="<?= $user['id'] ?>"><?= htmlspecialchars($user['name']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-primary">Send Invite</button>
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>

            <?php endif; ?>
        </div>
    </div>
</div>

<?php include '../partials/footer.php'; ?>