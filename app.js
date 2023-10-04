const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Create a MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_hbd'
  });

  // Connect to the MySQL database
db.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL database:', err);
      return;
    }
    console.log('Connected to MySQL database');
  });

// Create a new user
app.post('/users', (req, res) => {
    const newUser = req.body;

    const query = 'INSERT INTO users SET ?';

    db.query(query, newUser, (err, results) => {
      if (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Error creating user' });
        return;
      }

      newUser.id = results.insertId;
      res.status(201).json(newUser);
    });
  });

  // Update an existing user
  app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const updatedUser = req.body;

    const query = 'UPDATE users SET ? WHERE id = ?';

    db.query(query, [updatedUser, userId], (err, results) => {
      if (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Error updating user' });
        return;
      }

      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(updatedUser);
    });
  });

  // Delete a user by ID
  app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);

    const query = 'DELETE FROM users WHERE id = ?';

    db.query(query, userId, (err, results) => {
      if (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Error deleting user' });
        return;
      }

      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(204).end();
    });
  });

// Helper function to retrieve a user by ID from the database
async function getUserById(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      db.query(query, userId, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

// Lock file mechanism to prevent race conditions
const lockFilePath = './birthday_task.lock';

function isTaskLocked() {
  return fs.existsSync(lockFilePath);
}

function lockTask() {
  fs.writeFileSync(lockFilePath, '');
}

function unlockTask() {
  fs.unlinkSync(lockFilePath);
}

// Schedule a task to check for birthdays and send email messages at 9 am local time
async function sendBirthdayEmails() {
    if (isTaskLocked()) {
      return;
    }

    lockTask();

    try {
      const currentDate = new Date();
      for (const user of users) {
        const birthdayDate = new Date(user.birthday);
        birthdayDate.setFullYear(currentDate.getFullYear());
        birthdayDate.setHours(9, 0, 0, 0);

        if (
          currentDate.toDateString() === birthdayDate.toDateString() &&
          currentDate.getHours() === 9
        ) {
          const birthdayMessage = `Hey, ${user.firstName} ${user.lastName} it's your birthday`;

          try {
            const response = await axios.post('https://email-service.digitalenvision.com.au/send-email', {
              to: user.email ? user.email : 'someone@gmail.com',
              subject: 'Happy Birthday!',
              message: birthdayMessage,
            });

            if (response.status === 200) {
              console.log(`Birthday email sent to ${user.firstName} ${user.lastName}`);
            } else {
              console.error(`Error sending birthday email to ${user.firstName} ${user.lastName}`);
            }
          } catch (error) {
            console.error(`Error sending birthday email to ${user.firstName} ${user.lastName}:`, error);
          }
        }
      }
    } finally {
      unlockTask();
    }
  }

// Schedule the task to run every minute
setInterval(sendBirthdayEmails, 1000 * 60);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
