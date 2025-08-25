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
  console.log("=== POST /api/users endpoint hit ===");
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);

    try {
      const { clerk_id, email, provider } = req.body;
      console.log("Extracted data:", { clerk_id, email, provider });

      if (!clerk_id || !email) {
        console.error("Missing required fields");
        return res.status(400).json({ error: 'Missing clerk_id or email' });
      }

      console.log("Getting database connection...");
      const connection = await pool.promise().getConnection();
      console.log("Database connection established");
    
    console.log("Checking if user exists...");
    const [existing] = await connection.execute(
      'SELECT id FROM clerk_user WHERE clerk_id = ?',
      [clerk_id]
    );
    console.log("Existing user check result:", existing);
    
    
    if (existing.length > 0) {
      console.log("User already exists, returning existing user");
      connection.release();
      return res.status(200).json({ 
        success: true, 
        user_id: existing[0].id,
        message: 'User already exists' 
      });
    }

      console.log("Inserting new user...");
      const [result] = await connection.execute(
        'INSERT INTO clerk_user (clerk_id, email, provider, created_at) VALUES (?, ?, ?, NOW())',
        [clerk_id, email, provider]
      );
      console.log("Insert result:", result);
      connection.release();
      console.log("✅ User created successfully");
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
      
      const connection = await pool.promise().getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM clerk_user WHERE clerk_id = ?',
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

