</div> <!-- .container -->

<!-- Mobile Bottom Navbar (visible only on xs screens) -->
<nav class="mobile-bottom-nav fixed-bottom d-block d-sm-none">
    <div class="container-fluid justify-content-around">
        <ul class="navbar-nav flex-row w-100 justify-content-around">
            <?php if (isset($_SESSION['user_id'])): ?>
                <?php if ($_SESSION['role'] === 'admin'): ?>
                    <li class="nav-item">
                        <a class="nav-link text-center" href="<?= BASE_URL ?>/admin/dashboard.php">
                            <i class="bi bi-speedometer2"></i><br>Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link text-center" href="<?= BASE_URL ?>/admin/users.php">
                            <i class="bi bi-people"></i><br>Users
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link text-center" href="<?= BASE_URL ?>/admin/matches.php">
                            <i class="bi bi-list-check"></i><br>Matches
                        </a>
                    </li>
                <?php else: ?>
                    <li class="nav-item">
                        <a class="nav-link text-center" href="<?= BASE_URL ?>/public/dashboard.php">
                            <i class="bi bi-house-door"></i><br>Home
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link text-center" href="<?= BASE_URL ?>/public/messages.php">
                            <i class="bi bi-chat-dots"></i><br>Chat
                        </a>
                    </li>
                <?php endif; ?>
                <li class="nav-item">
                    <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#profileModal">
                        <i class="bi bi-person"></i><br>Profile</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-center" href="<?= BASE_URL ?>/public/logout.php">
                        <i class="bi bi-box-arrow-right"></i><br>Logout
                    </a>
                </li>
            <?php else: ?>
                <li class="nav-item">
                    <a class="nav-link text-center" href="<?= BASE_URL ?>/public/login.php">
                        <i class="bi bi-box-arrow-in-right"></i><br>Login
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link text-center" href="<?= BASE_URL ?>/public/register.php">
                        <i class="bi bi-person-plus"></i><br>Register
                    </a>
                </li>
            <?php endif; ?>
        </ul>
    </div>
</nav>

<!-- Bootstrap JS bundle -->

<!-- Bootstrap & dependencies -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= BASE_URL ?>/assets/js/master.js"></script>

</body>

</html>