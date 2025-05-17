
<?php
/*
session_start();


include('../partials/header.php');
include('../db.php');
?>

<?php if (isset($_GET['error'])): ?>
<div class="container">
    <div class="alert alert-danger text-center">
        <?php if ($_GET['error'] === 'duplicate'): ?>
            This email is already registered. Please <a href="login.php">log in</a> or use a different email.
        <?php else: ?>
            An unknown error occurred. Please try again later.
        <?php endif; ?>
    </div>
    </div>
<?php endif; ?>

<div class="container mt-5  mb-4">
<h2 class="display-6 mb-3">Register</h2>
    <form method="POST" action="../handlers/register_handler.php">
        <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" name="email" id="email" class="form-control" required>
        </div>
        <div class="mb-3">
            <label for="phone" class="form-label">Phone Number</label>
            <input type="text" name="phone" id="phone" class="form-control" required>
        </div>
        <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" name="password" id="password" class="form-control" required>
        </div>

        <button type="submit" class="btn">Register</button>
    </form>

<?php include('../partials/footer.php'); ?>


*/

ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
include '../partials/header.php'; ?>


<div class="container mt-5">
  <h2>Register</h2>
  <form action="../handlers/register_handler.php" method="POST">

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
            <input
            type="tel"
            class="form-control"
            name="phone"
            placeholder="Enter your phone number"
            required
            >
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

<!-- JOSH TO FIX THIS PLS -->
<!--
    <input type="text" id="postcode" name="postcode_raw" placeholder="Postcode" required class="form-control mb-2">
    <select id="address-select" class="form-select mb-2" required>
    <option value="">Select your address</option>
    </select>

    <!-- Hidden fields to store extracted values --
    <input type="hidden" name="line_1" id="line_1">
    <input type="hidden" name="line_2" id="line_2">
    <input type="hidden" name="line_3" id="line_3">
    <input type="hidden" name="town_or_city" id="town_or_city">
    <input type="hidden" name="county" id="county">
    <input type="hidden" name="postcode" id="postcode-final">
    <input type="hidden" name="formatted_address" id="formatted_address">

-->
  <div class="mb-3">
  <label for="password" class="form-label">Password</label>
  <input
    type="password"
    class="form-control"
    name="password"
    pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
    title="Password must be at least 8 characters long, with at least one uppercase letter and one number"
    required
  >
</div>

    <button type="submit" class="btn">Register</button>
  </form>
</div>

<!-- 
<script>
// Listen for changes (input events) in the 'postcode' input field
document.getElementById('postcode').addEventListener('input', function() {
    const postcode = this.value;  // Get the value of the postcode field as the user types

    // Only trigger the API call if the postcode length is 3 or more characters
    if (postcode.length >= 3) {  
        // Make a request to the autocomplete API to get address suggestions based on the postcode
        fetch(`../handlers/autocomplete_handler.php?action=autocomplete&postcode=${postcode}`)
            .then(response => response.json())  // Parse the response as JSON
            .then(data => {
                const addressSelect = document.getElementById('address-select');
                addressSelect.innerHTML = '<option value="">Select your address</option>';  // Clear previous address options

                // If the API returns suggestions, add them as options in the address dropdown
                if (data.suggestions) {
                    data.suggestions.forEach(suggestion => {
                        const option = document.createElement('option');
                        option.value = suggestion.id; // The value of each option will be the suggestion's ID
                        option.textContent = suggestion.address; // The display text will be the full address
                        addressSelect.appendChild(option);  // Append each new option to the dropdown
                    });
                }
            })
            .catch(err => console.error('Error fetching address suggestions:', err));  // Log any errors that occur during the fetch
    }
});

// Listen for when the user selects an address from the 'address-select' dropdown
document.getElementById('address-select').addEventListener('change', function() {
    const addressId = this.value;  // Get the selected address ID

    // If an address is selected (not empty), fetch the full address details
    if (addressId) {
        // Make a request to the API to get the full address details based on the selected address ID
        fetch(`../handlers/autocomplete_handler.php?action=get&addressId=${addressId}`)
            .then(response => response.json())  // Parse the response as JSON
            .then(data => {
                // Populate the form fields with the returned address details
                document.getElementById('line_1').value = data.line_1 || '';  // Address Line 1
                document.getElementById('line_2').value = data.line_2 || '';  // Address Line 2
                document.getElementById('line_3').value = data.line_3 || '';  // Address Line 3
                document.getElementById('town_or_city').value = data.town_or_city || '';  // Town or city
                document.getElementById('county').value = data.county || '';  // County
                document.getElementById('postcode-final').value = data.postcode || '';  // Postcode
                document.getElementById('formatted_address').value = data.formatted_address || '';  // Full address in formatted string
            })
            .catch(err => console.error('Error fetching full address details:', err));  // Log any errors that occur during the fetch
    }
});
</script>



<?php include '../partials/footer.php'; ?>


