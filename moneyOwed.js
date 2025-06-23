  const loggedInUser = localStorage.getItem('loggedInUser');
  const navUser = document.getElementById('nav-user');
  const userDropdown = document.getElementById('user-dropdown');
  const loginLink = document.getElementById('login-link');
  const logoutBtn = document.getElementById('logout-button');
  const form = document.getElementById('entryForm');
  const entryList = document.getElementById('entry-list');

  if (loggedInUser) {
    navUser.textContent = ` ${loggedInUser}`;
    userDropdown.style.display = 'inline-block';
    loginLink.style.display = 'none';
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('loggedInUser');
      window.location.reload();
    });
  } else {
    userDropdown.style.display = 'none';
    loginLink.style.display = 'inline-block';
  }
 
  function openEntryForm() {
    document.getElementById('entry-form-modal').style.display = 'flex';
  }

  function closeEntryForm() {
    document.getElementById('entry-form-modal').style.display = 'none';
  }

async function loadEntries() {
  if (!loggedInUser) return;

  try {
    const response = await fetch(`http://localhost:3000/get-entries?username=${encodeURIComponent(loggedInUser)}`);
    const result = await response.json();

    if (response.ok) {
      const entries = result.entries || [];

      entries.forEach(entry => {
        const entryCard = document.createElement('div');
        entryCard.classList.add('entry-card');
        entryCard.innerHTML = `
          <strong>${entry.title}</strong><br>$${entry.amount}
          <div class="entry-details">
            <p><strong>Notes:</strong> ${entry.notes || "None"}</p>
            <p><strong>Contributors:</strong><br>${entry.contributors.replace(/\n/g, '<br>').replace(/, ?/g, '<br>')}</p>
          </div>
          <div class="entry-actions">
            <div class="edit-icon" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
            </div>
            <div class="trash-icon" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#a00">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
              </svg>
            </div>
            <div class="email-icon" title="Email Contributors">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/>
              </svg>
            </div>
          </div>
        `;

        // Delete button logic
        entryCard.querySelector('.trash-icon').addEventListener('click', async () => {
          const confirmDelete = confirm("Are you sure you want to delete this entry?");
          if (!confirmDelete) return;

          try {
            const res = await fetch('http://localhost:3000/delete-entry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: loggedInUser,
                title: entry.title,
                amount: entry.amount
              })
            });

            const data = await res.json();

            if (res.ok) {
              entryCard.remove();
            } else {
              alert(data.error || "Could not delete entry.");
            }
          } catch (err) {
            console.error("Delete failed:", err);
            alert("Error deleting entry. Try again.");
          }
        });
        // Email icon logic
        entryCard.querySelector('.email-icon').addEventListener('click', () => {
          const emailList = entry.contributors
            .split(/[\n,]+/)
            .map(email => email.trim())
            .filter(email => email.length > 0);

          if (emailList.length > 0) {
            const mailtoLink = `mailto:${emailList.join(',')}`;
            window.location.href = mailtoLink;
          } else {
            alert("No valid contributor emails found.");
          }
        });

        // Edit button logic
        entryCard.querySelector('.edit-icon').addEventListener('click', async () => {
          const newTitle = prompt("Edit Title:", entry.title);
          const newAmount = prompt("Edit Amount:", entry.amount);
          const newContributors = prompt("Edit Contributors:", entry.contributors);
          const newNotes = prompt("Edit Notes:", entry.notes || '');

          if (!newTitle || !newAmount) {
            alert("Title and Amount are required.");
            return;
          }

          try {
            const res = await fetch('http://localhost:3000/edit-entry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: loggedInUser,
                oldTitle: entry.title,
                oldAmount: entry.amount,
                newTitle,
                newAmount,
                newContributors,
                newNotes
              })
            });

            const result = await res.json();
            if (res.ok) {
              alert("Entry updated!");
              window.location.reload();
            } else {
              alert(result.error || "Failed to update entry.");
            }
          } catch (err) {
            console.error("Update failed:", err);
            alert("Server error.");
          }
        });

        entryList.appendChild(entryCard);
      });
    } else {
      console.error(result.error || "Failed to load entries.");
    }
  } catch (err) {
    console.error("Error loading entries:", err);
  }
}

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = document.getElementById('entryTitle').value.trim();
    const amount = document.getElementById('entryAmount').value.trim();
    const contributors = document.getElementById('entryContributors').value.trim();
    const description = document.getElementById('entryDescription').value.trim();

    if (!loggedInUser) {
      alert("You're not logged in.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/add-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loggedInUser,
          title,
          amount,
          contributors,
          notes: description
        })
      });

      const result = await response.json();

      if (response.ok) {
        form.reset();
        closeEntryForm();
        loadEntries(); // reload entries
      } else {
        alert(result.error || 'Failed to add entry.');
      }
    } catch (err) {
      console.error(err);
      alert('Server error. Please try again later.');
    }
  }); 

  if (loggedInUser) {
    loadEntries(); 
  }
