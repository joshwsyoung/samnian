<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();

include '../partials/header.php';

// If BASE_URL is undefined, fallback to relative path or define it:
if (!defined('BASE_URL')) {
  define('BASE_URL', '');
}
?>


<div class="container mt-5">
  <h2>Register</h2>
  <form action="<?php echo BASE_URL; ?>/handlers/register_handler.php" method="POST">
    <div class="mb-3">
      <label for="name" class="form-label">Name</label>
      <input type="name" class="form-control" name="name" required>
    </div>

    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input type="email" class="form-control" name="email" required>
    </div>

    <div class="mb-3">
      <label for="phone" class="form-label">Phone Number</label>
      <input type="tel" class="form-control" name="phone" placeholder="Enter your phone number" required>
    </div>
    <div class="mb-3">
      <label for="city" class="form-label">City</label>
      <select class="form-control" name="city" required>
        <option value="">Select your city</option>
        <option value="London">London</option>
        <option value="Bristol">Bristol</option>
        <option value="Marlow">Marlow</option>
        <option value="Durban SA">Durban SA</option>
      </select>
    </div>

    <!-- JOSH TO FIX THIS PLS 
    <input type="text" id="postcode" name="postcode_raw" placeholder="Postcode" required class="form-control mb-2">
    <select id="address-select" class="form-select mb-2" required>
    <option value="">Select your address</option>
    </select>

    Hidden fields to store extracted values 
    <input type="hidden" name="line_1" id="line_1">
    <input type="hidden" name="line_2" id="line_2">
    <input type="hidden" name="line_3" id="line_3">
    <input type="hidden" name="town_or_city" id="town_or_city">
    <input type="hidden" name="county" id="county">
    <input type="hidden" name="postcode" id="postcode-final">
    <input type="hidden" name="formatted_address" id="formatted_address">-->

    <div class="mb-3">
      <label for="password" class="form-label">New Password</label>
      <div class="input-group">
        <input type="password" id="password" name="password" class="form-control" pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
          title="Password must be at least 8 characters long, with at least one uppercase letter and one number"
          required>
        <button class="toggle-btn" type="button" onclick="togglePassword('password', this)">
          <i class="bi bi-eye-slash"></i>
        </button>
      </div>
    </div>

    <button type="submit" class="btn">Register</button>
  </form>
</div>

<?php include '../partials/footer.php'; ?>