const form = document.getElementById('form');
const username_input = document.getElementById('username-input');
const email_input = document.getElementById('email-input');
const password_input = document.getElementById('password-input');
const repeat_password_input = document.getElementById('repeat-password-input');
const error_message = document.getElementById('error-message');
form.addEventListener('submit',  (e) =>{
    //e.preventDefault()
    let errors =[]
    if (username_input) {//this means this is for the signup page
        errors= getSignupFormErrors(username_input.value, email_input.value, password_input.value, repeat_password_input.value);
    }
    else{
        // this is for the login page
        errors = getLoginFormErrors(email_input.value, password_input.value);
    }
    if (errors.length > 0) {
    e.preventDefault();
    error_message.innerText = errors.join(', ');
    }
})

function getSignupFormErrors(username, email, password, repeatPassword){
    let errors = [];

    if (username = null || username === "") {
        errors.push("Username cannot be empty");
        username_input.parentElement.classList.add('incorrect');
    }
    if (email = null || email === "") {
        errors.push("Email cannot be empty");
        email_input.parentElement.classList.add('incorrect');
    }
    if (password = null || password === "") {
        errors.push("Password cannot be empty");
        password_input.parentElement.classList.add('incorrect');
    }
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
        password_input.parentElement.classList.add('incorrect');
    }
    if(password !== repeatPassword){
        errors.push("Passwords do not match");
        password_input.parentElement.classList.add('incorrect');
        repeat_password_input.parentElement.classList.add('incorrect');
    }
    
    return errors;
}