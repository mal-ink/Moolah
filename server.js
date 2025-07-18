require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { writeHeapSnapshot } = require('v8');
const { getDefaultHighWaterMark } = require('stream');
const { join } = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = './users.json';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.use(express.json());

const cors = require('cors');
app.use(cors({ origin: '*' }));
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

//signup backend
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
  };//stuff that gets pushed to the json files

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

//entry cards :)
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

  const emailPattern = /^[^@]+@[^@]+\.(com|ca)$/i;

const invalidContributors = contributors
  .split(/[\n,]+/) 
  .map(email => email.trim())
  .filter(email => email.length > 0 && !emailPattern.test(email));

if (invalidContributors.length > 0) {
  return res.status(400).json({
    message: `Invalid contributor emails: ${invalidContributors.join(', ')}`
  });
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

// if (!username || !title || !amount) {
//    return res.status(400).json({ error: "Missing required fields." });
//}

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
app.post('/edit-entry', (req, res) => {
  const {
    username,
    oldTitle,
    oldAmount,
    title,
    amount,
    contributors,
    notes
  } = req.body;

  console.log("Edit received payload:", req.body); 

  if (!username || !oldTitle || !oldAmount || !title || !amount) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const entryIndex = user.entries.findIndex(
    e => e.title === oldTitle && parseFloat(e.amount) === parseFloat(oldAmount)
  );

  if (entryIndex === -1) {
    return res.status(404).json({ error: "Original entry not found." });
  }   
   // Update entry
  user.entries[entryIndex] = {
    title,
    amount,
    contributors,
    notes
  };  

  saveUsers(users);
  res.json({ success: true, message: "Entry updated successfully." });
});


//email stuff😡😡
app.post('/send-email', (req, res) => {
  const { recipients, subject, message, sender } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !message || !sender) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const emailPattern = /^[^@]+@[^@]+\.(com|ca)$/i;
  const invalidEmails = recipients.filter(email => !emailPattern.test(email));

  if (invalidEmails.length > 0) {
    return res.status(400).json({ error: `Invalid emails:\n${invalidEmails.join(', ')}` });
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
    to: recipients.join(','),
    subject,
    text: `${message}\n\nSent by: ${sender}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Email error:', err);
      return res.status(500).json({ error: 'Failed to send email.' });
    } else {
      console.log('Email sent:', info.response);
      res.json({ success: true, message: 'Emails sent successfully!' });
    }
  });
});

//its lowk repeated but im scaredif i take it out itll like break down so it gets to stay idk
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

//reset passwordsd
app.post('/reset-password', (req, res) => {
  const { username, email } = req.body; 

  let users = [];
  try {
    const data = fs.readFileSync(USERS_FILE);
    users = JSON.parse(data);
  } catch (err) {
    return res.status(500).json({ error: 'Could not read users file.' });
  }

  // Find matching user
  const user = users.find(u => u.username === username && u.email === email);
  if (!user) {
    return res.status(400).json({ error: 'Username and email do not match.' });
  }

  // Send reset email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    text: `Hi ${username},\n\nHere is your password reset link:\n https://moolah-sy5t.onrender.com/reset-confirm.html\n\nIf you didn't request this, ignore it.`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Email error:", err);
      return res.status(500).json({ error: 'Failed to send email.' });
    } else {
      console.log('Reset email sent:', info.response);
      return res.json({ message: 'Reset email sent successfully.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

