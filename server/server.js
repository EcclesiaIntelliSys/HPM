const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');


if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo connected'))
  .catch(err => console.error(err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);

// ✅ Serve React build in production
if (process.env.NODE_ENV === 'production') {
  console.log('XXXXXXXXXX');
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Catch-all route for React Router
  app.get('*', (req, res) => {
    // res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
      res.json({ status: 'hoooooy' });

  });
}


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
