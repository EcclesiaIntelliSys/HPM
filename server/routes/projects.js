const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// simple email validator
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

// POST /api/projects
router.post('/', async (req, res) => {

  try {
    const { option, whoFor, description, otherMessage, email } = req.body;

    // Validate presence
    if (!option || !whoFor || !description || !otherMessage || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate types
    if ([option, whoFor, description, otherMessage, email].some(f => typeof f !== 'string')) {
      return res.status(400).json({ error: 'Invalid field types' });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const project = new Project({ option, whoFor, description, otherMessage, email });

    await project.save();

    return res.status(201).json({ message: 'Saved', id: project._id });
  } catch (err) {
    console.error('POST /api/projects error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
