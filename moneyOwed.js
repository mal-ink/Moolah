const loggedInUser = localStorage.getItem('loggedInUser');
const navUser = document.getElementById('nav-user');
const userDropdown = document.getElementById('user-dropdown');
const loginLink = document.getElementById('login-link');
const logoutBtn = document.getElementById('logout-button');
const form = document.getElementById('entryForm');
const entryList = document.getElementById('entry-list');
const sortSelect = document.getElementById('sort-select');
console.log('Logged in user is:', loggedInUser);

function openEntryForm() {
  const modal = document.getElementById('entry-form-modal');
  modal.style.display = 'flex';

  setTimeout(() => {
    document.getElementById('entryTitle').focus();
  }, 100);
}

function closeEntryForm() {
  document.getElementById('entry-form-modal').style.display = 'none';
  form.removeAttribute('data-editing');
  form.removeAttribute('data-original-title');
  form.removeAttribute('data-original-amount');
}

function showConfirmation() {
  const popup = document.getElementById('confirmation-popup');
  popup.classList.add('show');
  setTimeout(() => {
    popup.classList.remove('show');
  }, 2000);
}

if (loggedInUser) {
  navUser.textContent = loggedInUser;
  userDropdown.style.display = 'inline-block';
  loginLink.style.display = 'none';
  logoutBtn.onclick = () => {
    localStorage.removeItem('loggedInUser');
    location.reload();
  };
} else {
  userDropdown.style.display = 'none';
  loginLink.style.display = 'inline-block';
}

if (loggedInUser) loadEntries();

if (sortSelect) {
  sortSelect.addEventListener('change', loadEntries);
}

async function loadEntries() {
  entryList.innerHTML = '';

  const addCard = document.createElement('div');
  addCard.className = 'add-entry-card';
  addCard.onclick = openEntryForm;
  addCard.innerHTML = `
    <img src="Background .PNG" alt="Card background">
    <div class="overlay-text">
      <p class="card__plus">+</p>
      <p class="card__title">Add Entry</p>
    </div>
  `;
  entryList.appendChild(addCard);

  try {
    const response = await fetch(`http://localhost:3000/get-entries?username=${encodeURIComponent(loggedInUser)}`);
    let { entries = [] } = await response.json();

    const sortValue = sortSelect ? sortSelect.value : '';
    if (sortValue === 'amount-desc') {
      entries.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else if (sortValue === 'amount-asc') {
      entries.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    }  

    entries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <strong>${entry.title}</strong><br>$${entry.amount}
        <div class="entry-details">
          <p><strong>Notes:</strong> ${entry.notes || 'None'}</p>
          <p><strong>Contributors:</strong><br>${entry.contributors.replace(/\n|, ?/g, '<br>')}</p>
        </div>
        <div class="entry-actions">
          <div class="edit-icon" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></div>
          <div class="trash-icon" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></div>
          <div class="email-icon" title="Email Contributors"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/></svg></div>
        </div>
      `;
   
      card.querySelector('.trash-icon').onclick = async () => {
        if (!confirm("Delete this entry?")) return;
        const res = await fetch('http://localhost:3000/delete-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loggedInUser, title: entry.title, amount: entry.amount })
        });
        if (res.ok) card.remove();
        else alert((await res.json()).error || "Delete failed.");
      };

      // Email stuff! - fix where it sends the username instead of the email
card.querySelector('.email-icon').onclick = async () => {
  const emails = entry.contributors
    .split(/[\n,]+/)
    .map(e => e.trim())
    .filter(e => e);

  if (!emails.length) {
    return alert("No valid contributor emails found.");
  }

  const subject = `Expense Reminder: ${entry.title}`;
  const message = `Hey! You contributed to "${entry.title}" ($${entry.amount}).\n\nNotes: ${entry.notes || 'None'} Message sent by Moolah - managing money simpler, smarter, and stress-free!`;
  
  const payload = {
    recipients: emails,
    subject,
    message,
    sender: loggedInUser
  };

  try {
    const res = await fetch('http://localhost:3000/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (res.ok) {
      alert("Email(s) sent successfully!");
    } else {
      alert(result.error || "Email failed to send.");
    }
  } catch (err) {
    console.error("Email send error:", err);
    alert("Server error. Try again.");
  }
};
      card.querySelector('.edit-icon').onclick = () => {
        openEntryForm();
        document.getElementById('entryTitle').value = entry.title;
        document.getElementById('entryAmount').value = entry.amount;
        document.getElementById('entryContributors').value = entry.contributors;
        document.getElementById('entryDescription').value = entry.notes || '';
        form.setAttribute('data-editing', 'true');
        form.setAttribute('data-original-title', entry.title);
        form.setAttribute('data-original-amount', entry.amount);
      };

      entryList.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading entries:", err);
  }   
}  

form.onsubmit = async e => {
  e.preventDefault();

  const title = document.getElementById('entryTitle').value.trim();
  const amount = document.getElementById('entryAmount').value.trim();
  const contributors = document.getElementById('entryContributors').value.trim();
  const notes = document.getElementById('entryDescription').value.trim();

  if (!title || !amount) return alert("Title and amount are required.");
  
  const emailPattern = /^[^@]+@[^@]+\.(com|ca)$/i;
  const invalidContributors = contributors
    .split(/[\n,]+/)
    .map(e => e.trim())
    .filter(e => e.length > 0 && !emailPattern.test(e));

  if (invalidContributors.length > 0) {
    return alert(`Invalid contributor emails:\n${invalidContributors.join('\n')}`);
  }  

   
  const isEditing = form.getAttribute('data-editing') === 'true';
  const url = isEditing ? '/edit-entry' : '/add-entry';
  const payload = {
    username: loggedInUser,
    title,
    amount,
    contributors,
    notes
  };

  if (isEditing) {
    payload.oldTitle = form.getAttribute('data-original-title');
    payload.oldAmount = form.getAttribute('data-original-amount');
  }

  try {
    const response = await fetch(`http://localhost:3000${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok) {
      closeEntryForm();
      showConfirmation();
      loadEntries();
    } else {
      alert(result.error || 'Could not save entry.');
    }
  } catch (err) {
    console.error("Submit error:", err);
    alert("Server error. Try again.");
  }
};

//dark mode - CHANGE UP ALL THE STYLING all the edit/delete buttons etc disappear....
document.addEventListener('keydown', (e) => {
  if (
    (e.key === 'n' || e.key === '/') &&
    !e.target.matches('input, textarea') &&
    document.getElementById('entry-form-modal').style.display !== 'flex'
  ) {
    e.preventDefault();
    openEntryForm();
  }
});
const toggleButton = document.getElementById('dark-mode-toggle');


if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  toggleButton.textContent = '☀️';
} else {
  toggleButton.textContent = '🌙';
}

toggleButton.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark);
  toggleButton.textContent = isDark ? '☀️' : '🌙';
});
