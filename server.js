require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;
const USERS_FILE = './users.json';

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname));

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE));
  } catch (err) {
    console.error('Failed to read users file:', err);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Failed to save users file:', err);
  }
}

app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const emailPattern = /^[^@]+@[^@]+\.(com|ca)$/i;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ message: 'Email must contain "@" and end with .com or .ca' });
  }

  const users = loadUsers();
  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const newUser = {
    username,
    email,
    password,
    entries: [] 
  };

  users.push(newUser);
  saveUsers(users);

  res.status(200).json({ message: 'Signup successful!' });
});

// login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.status(200).json({ message: 'Login successful!', username: user.username });
});

app.post('/add-entry', (req, res) => {
  const { username, title, amount, contributors, notes } = req.body;

  if (!username || !title || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.entries.push({ title, amount, contributors, notes });
  saveUsers(users);

  res.json({ success: true });
});

// heheheh it works
app.get('/get-entries', (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ entries: user.entries || [] });
});

// contact us js!
app.post('/contact', (req, res) => {
  const { firstname, lastname, email, reason } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: 'New Contact Form Submission',
    text: `Name: ${firstname} ${lastname}\nEmail: ${email}\nReason: ${reason}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error sending message.');
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Message sent!');
    }
  });
});

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// delete entries!
app.post('/delete-entry', (req, res) => {
  const { username, title, amount } = req.body;

  if (!username || !title || !amount) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const originalLength = user.entries.length;

  user.entries = user.entries.filter(entry =>
  !(entry.title === title && parseFloat(entry.amount) === parseFloat(amount))
);


  if (user.entries.length === originalLength) {
    return res.status(404).json({ error: "Entry not found." });
  }

  writeUsers(users);
  res.json({ message: "Entry deleted successfully." });
});

app.post('/send-email', (req, res) => {
  const { recipients, subject, message, sender } = req.body;

  if (!recipients || recipients.length === 0 || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients,
    subject: subject,
    text: `${message}\n\nSent by: ${sender}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Email error:', err);
      return res.status(500).json({ error: 'Failed to send email.' });
    } else {
      console.log('Email sent:', info.response);
      res.json({ success: true });
    }
  });
});


app.listen(PORT, () => {
  console.log(`‼️Server running on http://localhost:${PORT}‼️`);
});