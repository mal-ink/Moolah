// loadNavbar.js
document.addEventListener("DOMContentLoaded", function () {
  fetch("navbar.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("navbar-container").innerHTML = data;
      
      // Run login/logout display logic AFTER navbar is loaded
      const navUser = document.getElementById('nav-user');
      const logoutBtn = document.getElementById('logout-button');
      const loggedInUser = localStorage.getItem('loggedInUser');

      if (loggedInUser) {
        navUser.textContent = loggedInUser;
        if (logoutBtn) logoutBtn.style.display = 'block';
        logoutBtn?.addEventListener('click', () => {
          localStorage.removeItem('loggedInUser');
          window.location.reload();
        });
      } else {
        navUser.innerHTML = `<a href="account.html" id="login-link" style="color: black;">Login</a>`;
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    })
    .catch(error => console.error("Navbar load error:", error));
});