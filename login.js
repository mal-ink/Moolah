require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;
const USERS_FILE = './users.json';

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Load users if file exists
let users = [];
if (fs.existsSync(USERS_FILE)) {
  const data = fs.readFileSync(USERS_FILE);
  try {
    users = JSON.parse(data);
  } catch (e) {
    console.error("❌ Failed to parse users.json:", e);
    users = [];
  }
}

// Save users to file
function saveUsersToFile() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ✅ Signup Route
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  console.log("📝 Signup data received:", { username, email });

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const userExists = users.find(user => user.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const newUser = {
    username,
    email,
    password,
    entries: [ ],                      //  Ensure entries array exists
  };

  users.push(newUser);
  saveUsersToFile(); 

  res.status(200).json({ message: 'Signup successful!' });
});

//  Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  console.log("🔐 Login attempt:", { email });

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = users.find(user => user.email === email && user.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.status(200).json({ message: 'Login successful!', username: user.username });
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Auth server running at http://localhost:${PORT}`);
});
