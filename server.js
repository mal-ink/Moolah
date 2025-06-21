require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
require('dotenv').config();

app.post('/contact', (req, res) => {
  const { firstname, lastname, email, reason } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
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


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.json());

const USERS_FILE = './users.json';

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

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

  if (!user.entries) user.entries = [];

  user.entries.push({
    title,
    amount,
    contributors,
    notes
  });

  saveUsers(users);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
