require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;
const USERS_FILE = './users.json';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let users = [];
if (fs.existsSync(USERS_FILE)) {
  const data = fs.readFileSync(USERS_FILE);
  users = JSON.parse(data);
}

function saveUsersToFile() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  console.log("Signup data received:", { username, email, password });

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const userExists = users.find(user => user.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const newUser = { username, email, password };
  users.push(newUser);
  saveUsersToFile();

  res.status(200).json({ message: 'Signup successful!' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
