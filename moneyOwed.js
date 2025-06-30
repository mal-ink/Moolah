const loggedInUser = localStorage.getItem('loggedInUser');
const navUser = document.getElementById('nav-user');
const userDropdown = document.getElementById('user-dropdown');
const loginLink = document.getElementById('login-link');
const logoutBtn = document.getElementById('logout-button');
const form = document.getElementById('entryForm');
const entryList = document.getElementById('entry-list');

function openEntryForm() {
  const modal = document.getElementById('entry-form-modal');
  modal.style.display = 'flex';

  const draft = JSON.parse(localStorage.getItem('entryDraft') || '{}');
  document.getElementById('entryTitle').value = draft.title || '';
  document.getElementById('entryAmount').value = draft.amount || '';
  document.getElementById('entryContributors').value = draft.contributors || '';
  document.getElementById('entryDescription').value = draft.notes || '';

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
    const { entries = [] } = await response.json();

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
          <div class="edit-icon" title="Edit">...</div>
          <div class="trash-icon" title="Delete">...</div>
          <div class="email-icon" title="Email Contributors">...</div>
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

      card.querySelector('.email-icon').onclick = () => {
        const emails = entry.contributors.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
        if (emails.length) window.location = `mailto:${emails.join(',')}`;
        else alert("No valid contributor emails found.");
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
  const invalidContributors = contributors.split(/[\n,]+/).map(e => e.trim()).filter(e => e.length > 0 && !emailPattern.test(e));

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
      localStorage.removeItem('entryDraft');
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

setInterval(() => {
  const draft = {
    title: document.getElementById('entryTitle').value.trim(),
    amount: document.getElementById('entryAmount').value.trim(),
    contributors: document.getElementById('entryContributors').value.trim(),
    notes: document.getElementById('entryDescription').value.trim()
  };
  localStorage.setItem('entryDraft', JSON.stringify(draft));
}, 2000);

document.addEventListener('keydown', (e) => {
  if ((e.key === 'n' || e.key === '/') && !e.target.matches('input, textarea') && document.getElementById('entry-form-modal').style.display !== 'flex') {
    e.preventDefault();
    openEntryForm();
  }
});
