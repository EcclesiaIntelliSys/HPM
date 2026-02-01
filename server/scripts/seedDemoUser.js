// /server/scripts/seedDemoUser.js
// Usage: node scripts/seedDemoUser.js
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const demoEmail = 'demo@artist.local';
  const demoPassword = 'DemoPass123!'; // change after first login
  const existing = await User.findOne({ email: demoEmail });
  if (existing) {
    console.log('Demo user already exists:', demoEmail);
    await mongoose.disconnect();
    process.exit(0);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(demoPassword, saltRounds);

  const user = new User({
    email: demoEmail,
    passwordHash,
    role: 'artist'
  });

  await user.save();
  console.log('Demo user created:');
  console.log('  email:', demoEmail);
  console.log('  password:', demoPassword);
  console.log('  NOTE: change this password after first login.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error seeding demo user', err);
  process.exit(1);
});
