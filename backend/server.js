const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'https://food-gyan.vercel.app' }));
app.use(express.json());


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
});
app.use('/api/auth/login', loginLimiter);


app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});