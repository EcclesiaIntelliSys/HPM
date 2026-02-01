const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors()); app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(()=>console.log('Mongo connected'));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(process.env.PORT||5000, ()=>console.log('Server running'));
