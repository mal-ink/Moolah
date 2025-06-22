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

    error_message.innerText = '';
    document.querySelectorAll('.incorrect').forEach(el => el.classList.remove('incorrect'));

    const username = username_input.value.trim();
    const email = email_input.value.trim();
    const password = password_input.value;
    const repeatPassword = repeat_password_input.value;

    const errors = [];

    // Validation
    if (!username) {
      errors.push("Username cannot be empty");
      username_input.parentElement.classList.add('incorrect');
    }
    if (!email) {
      errors.push("Email cannot be empty");
      email_input.parentElement.classList.add('incorrect');
    } else if (!email.includes('@') || (!email.endsWith('.com') && !email.endsWith('.ca'))) {
      errors.push("Email must contain '@' and end with .com or .ca");
      email_input.parentElement.classList.add('incorrect');
    }

    if (!password) {
      errors.push("Password cannot be empty");
      password_input.parentElement.classList.add('incorrect');
    } else if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
      password_input.parentElement.classList.add('incorrect');
    }

    if (password !== repeatPassword) {
      errors.push("Passwords do not match");
      password_input.parentElement.classList.add('incorrect');
      repeat_password_input.parentElement.classList.add('incorrect');
    }

    if (errors.length > 0) {
      error_message.innerText = errors.join(', ');
      return;
    }

    // Send signup request
    try {
      const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('loggedInUser', username);
        window.location.href = 'index.html'; // or wherever your homepage is
      } else {
        error_message.innerText = result.message || 'Signup failed.';
      }
    } catch (err) {
      console.error(err);
      error_message.innerText = 'Something went wrong. Please try again later.';
    }
  });
}); 
