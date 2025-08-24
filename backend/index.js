const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Database connection

//Add credentials to .env file
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'your_database'
  });


// Add user to database table
app.post('/api/users', async (req, res) => {
    try {
      console.log("Inside the api/users endpoint")
      const { clerk_id, email, provider } = req.body;
      console.log("clerk_id: ", clerk_id)
      console.log("email: ", email)
      console.log("provider: ", provider)
      
      const connection = pool.getConnection();
      console.log("Database connection successful");

      const [result] = await connection.execute(
        'INSERT INTO users (clerk_id, email, provider, created_at) VALUES (?, ?, ?, NOW())',
        [clerk_id, email, provider]
      );
      connection.release();
      console.log("User created successfully:", result);
      
      res.status(201).json({ success: true, user_id: result.insertId });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });


  // Get user endpoint
app.get('/api/users/:clerk_id', async (req, res) => {
    try {
      const { clerk_id } = req.params;
      
      const connection = pool.getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE clerk_id = ?',
        [clerk_id]
      );
      connection.release();
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });
  










app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

