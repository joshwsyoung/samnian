// Fade in the body on initial load
window.addEventListener("DOMContentLoaded", function () {
    // Slight delay to allow CSS parsing
    setTimeout(() => {
        document.body.classList.add("fade-in");
    }, 10);
});

window.addEventListener("load", function () {
    const preloader = document.getElementById("preloader");
    const mainContent = document.getElementById("main-content");

    // Wait before fading out the preloader
    setTimeout(() => {
        if (preloader) {
            preloader.style.transition = "opacity 0.5s ease";
            preloader.style.opacity = "0";

            // After fade-out, hide preloader completely
            setTimeout(() => {
                preloader.style.display = "none";
                if (mainContent) mainContent.style.display = "block";
            }, 500); // Match fade-out duration
        }
    }, 700); // Delay before fade-out starts
});

// Smooth page transitions
document.querySelectorAll('a[href]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = this.getAttribute('href');

        // Skip for anchors, external links, or hash-only links
        if (
            target.startsWith('#') ||
            target.startsWith('http') ||
            this.target === '_blank'
        ) return;

        e.preventDefault();

        // Handle body fade-out
        document.body.classList.remove('fade-in');
        document.body.classList.add('fade-out');

        // Wait for the fade-out transition before navigating
        setTimeout(() => {
            window.location.href = target;
        }, 400); // Match fade-out duration
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const options = document.querySelectorAll('.card-option');
    const hiddenInput = document.getElementById('selectedInterests');

    options.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('selected');

            const selectedValues = Array.from(options)
                .filter(opt => opt.classList.contains('selected'))
                .map(opt => opt.dataset.value);

            hiddenInput.value = selectedValues.join(',');
        });
    });
});

    // Check if the success or error message exists
    window.onload = function() {
        var successMessage = document.getElementById("successMessage");
        var errorMessage = document.getElementById("errorMessage");

        // Hide success message after 5 seconds
        if (successMessage) {
            setTimeout(function() {
                successMessage.style.display = "none";
            }, 5000);
        }

        // Hide error message after 5 seconds
        if (errorMessage) {
            setTimeout(function() {
                errorMessage.style.display = "none";
            }, 5000);
        }
    }
    // Toggle password visibility
    function togglePassword(fieldId, button) {
                    const input = document.getElementById(fieldId);
                    const icon = button.querySelector('i');
                    const isHidden = input.type === 'password';
                    input.type = isHidden ? 'text' : 'password';
                    icon.classList.toggle('bi-eye', isHidden);
                    icon.classList.toggle('bi-eye-slash', !isHidden);
                }
        // Handle the code input for the verification page
        const inputs = document.querySelectorAll('.code-input');
        const hiddenInput = document.getElementById('fullCode');
        const form = document.getElementById('codeForm');

        inputs[0].focus();

        inputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                if (input.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });

        form.addEventListener('submit', (e) => {
            const code = Array.from(inputs).map(input => input.value).join('');
            hiddenInput.value = code;

            if (code.length < 4) {
                e.preventDefault();
                alert("Please enter all 4 digits of the code.");
            }
        });
        