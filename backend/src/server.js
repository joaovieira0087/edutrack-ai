const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const routes = require('./routes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

const path = require('path');

// Middlewares
app.use(cors());
app.use(express.json());

// Public folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Main Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('EduTrack AI API is running...');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocorreu um erro no servidor!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
