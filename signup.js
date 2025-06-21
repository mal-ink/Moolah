//this is all still frontend i think but some of it get s overriden byt the other frontend code?? i think i have repeats
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('signup-form');
  const username_input = document.getElementById('username-input');
  const email_input = document.getElementById('email-input');
  const password_input = document.getElementById('password-input');
  const repeat_password_input = document.getElementById('repeat-password-input');
  const error_message = document.getElementById('error-message');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Clear any previous error styles
    document.querySelectorAll('.incorrect').forEach(el => el.classList.remove('incorrect'));

    const errors = [];

    if (!username_input.value.trim()) {
      errors.push("Username cannot be empty");
      username_input.parentElement.classList.add('incorrect');
    }
    if (!email_input.value.trim()) {
      errors.push("Email cannot be empty");
      email_input.parentElement.classList.add('incorrect');
    }
    if (!password_input.value.trim()) {
      errors.push("Password cannot be empty");
      password_input.parentElement.classList.add('incorrect');
    }
    if (password_input.value.length < 8) {
      errors.push("Password must be at least 8 characters long");
      password_input.parentElement.classList.add('incorrect');
    }
    if (password_input.value !== repeat_password_input.value) {
      errors.push("Passwords do not match");
      password_input.parentElement.classList.add('incorrect');
      repeat_password_input.parentElement.classList.add('incorrect');
    }

    if (errors.length > 0) {
      error_message.innerText = errors.join(', ');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username_input.value,
          email: email_input.value,
          password: password_input.value
        })
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('loggedInUser', username_input.value);
        window.location.href = 'index.html'; // go to home page 
      } else {
        error_message.innerText = result.message || 'Signup failed.';
      }

    } catch (err) {
      error_message.innerText = 'Something went wrong. Try again later.';
      console.error(err);
    }
  });
});
