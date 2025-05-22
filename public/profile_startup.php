<?php
session_start();
include_once('../partials/header.php');
include_once('../config.php');
include_once('../db.php');
include_once('../partials/auth_check.php');

$user_id = $_SESSION['user_id'];
?>
<div class="container mt-5">
    <h3 class="mb-4">Let’s build your profile 🚀</h3>
    <div class="progress mb-4">
        <div id="progressBar" class="progress-bar" role="progressbar" style="width: 0%">Step 1 of 3</div>
    </div>
    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#step1">Start</button>
</div>

<!-- Step 1: DOB -->
<div class="modal fade" id="step1" tabindex="-1">
  <div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">How old are you?</h5></div>
    <div class="modal-body"><input type="date" id="dob" class="form-control"></div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveDOB()">Next</button>
    </div>
  </div></div>
</div>

<!-- Step 2: City -->
<div class="modal fade" id="step2" tabindex="-1">
  <div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Where are you based?</h5></div>
    <div class="modal-body">
      <select id="city" class="form-select">
        <option disabled selected>Select city</option>
        <option>London</option><option>Manchester</option>
        <option>Birmingham</option><option>Leeds</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveCity()">Next</button>
    </div>
  </div></div>
</div>

<!-- Step 3: Interests -->
<div class="modal fade" id="step3" tabindex="-1">
  <div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Pick your interests</h5></div>
    <div class="modal-body">
      <div id="interests" class="d-flex flex-wrap gap-2">
        <?php
        $stmt = $conn->query("SELECT * FROM interests ORDER BY name");
        foreach ($stmt->fetchAll() as $i): ?>
          <label class="btn btn-outline-secondary">
            <input type="checkbox" class="btn-check" value="<?= $i['id'] ?>"> <?= htmlspecialchars($i['name']) ?>
          </label>
        <?php endforeach; ?>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-success" onclick="saveInterests()">Finish & Take Test</button>
    </div>
  </div></div>
</div>

<script>
let progress = 0;

function updateProgress(step) {
  progress = step * 33;
  document.getElementById('progressBar').style.width = progress + '%';
  document.getElementById('progressBar').innerText = `Step ${step} of 3`;
}

function saveDOB() {
  const dob = document.getElementById('dob').value;
  if (!dob) return alert("Please select your date of birth.");

  fetch('../handlers/update_profile_field.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'field=dob&value=' + encodeURIComponent(dob)
  }).then(() => {
    new bootstrap.Modal(document.getElementById('step2')).show();
    updateProgress(2);
  });
}

function saveCity() {
  const city = document.getElementById('city').value;
  if (!city) return alert("Please select a city.");

  fetch('../handlers/update_profile_field.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'field=city&value=' + encodeURIComponent(city)
  }).then(() => {
    new bootstrap.Modal(document.getElementById('step3')).show();
    updateProgress(3);
  });
}

function saveInterests() {
  const selected = [...document.querySelectorAll('#interests input:checked')].map(cb => cb.value);
  if (selected.length === 0) return alert("Please choose at least one interest.");

  fetch('../handlers/save_interests.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ interests: selected })
  }).then(() => {
    window.location.href = 'ocean_test.php';
  });
}
</script>

<?php include_once('../partials/footer_no_nav.php'); ?>
