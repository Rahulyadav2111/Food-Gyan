const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const driver = require('../config/neo4j');
const router = express.Router();
require('dotenv').config();

const JWT_SECRET = process.env.JWT_TOKEN;

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!driver || typeof driver.session !== 'function') {
    return res.status(500).json({ message: 'Database driver not initialized' });
  }

  const session = driver.session();
  try {
    // Check for existing user
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email }
    );
    if (result.records.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await session.run(
      'CREATE (u:User {email: $email, password: $password})',
      { email, password: hashedPassword }
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

// Login (similarly update with driver check)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!driver || typeof driver.session !== 'function') {
    return res.status(500).json({ message: 'Database driver not initialized' });
  }

  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u',
      { email }
    );

    if (result.records.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    await session.close();
  }
});

module.exports = router;