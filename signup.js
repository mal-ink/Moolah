const form = document.querySelector('form');
const username_input = document.getElementById('username-input');
const email_input = document.getElementById('email-input');
const password_input = document.getElementById('password-input');
const repeat_password_input = document.getElementById('repeat-password-input');
const error_message = document.getElementById('error-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    let errors = getSignupFormErrors(
        username_input.value,
        email_input.value,
        password_input.value,
        repeat_password_input.value
    );

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
            alert('Signup successful!');
            window.location.href = 'account.html'; 
        } else {
            error_message.innerText = result.message || 'Signup failed.';
        }

    } catch (err) {
        error_message.innerText = 'Something went wrong. Try again later.';
        console.error(err);
    }
});

function getSignupFormErrors(username, email, password, repeatPassword) {
    let errors = [];

    if (!username || username.trim() === '') {
        errors.push("Username cannot be empty");
        username_input.parentElement.classList.add('incorrect');
    }
    if (!email || email.trim() === '') {
        errors.push("Email cannot be empty");
        email_input.parentElement.classList.add('incorrect');
    }
    if (!password || password.trim() === '') {
        errors.push("Password cannot be empty");
        password_input.parentElement.classList.add('incorrect');
    }
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
        password_input.parentElement.classList.add('incorrect');
    }
    if (password !== repeatPassword) {
        errors.push("Passwords do not match");
        password_input.parentElement.classList.add('incorrect');
        repeat_password_input.parentElement.classList.add('incorrect');
    }

    return errors;
}
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('signup-form');
  const username_input = document.getElementById('username-input');
  const email_input = document.getElementById('email-input');
  const password_input = document.getElementById('password-input');
  const repeat_password_input = document.getElementById('repeat-password-input');
  const error_message = document.getElementById('error-message');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const errors = [];
    if (!username_input.value) errors.push("Username cannot be empty");
    if (!email_input.value) errors.push("Email cannot be empty");
    if (!password_input.value) errors.push("Password cannot be empty");
    if (password_input.value.length < 8) errors.push("Password must be at least 8 characters");
    if (password_input.value !== repeat_password_input.value) errors.push("Passwords do not match");

    if (errors.length > 0) {
      error_message.innerText = errors.join(', ');
      return;
    }

    fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username_input.value,
        email: email_input.value,
        password: password_input.value,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Signup successful!') {
          localStorage.setItem('loggedInUser', username_input.value);
          window.location.href = 'index.html';
        } else {
          error_message.innerText = data.message;
        }
      })
      .catch(error => {
        console.error('Error:', error);
        error_message.innerText = 'Something went wrong. Please try again.';
      });
  });
});
