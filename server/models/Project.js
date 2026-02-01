const mongoose = require('mongoose');
const ProjectSchema = new mongoose.Schema({
  option: { type: String, required: true },
  whoFor: { type: String, required: true },
  description: { type: String, required: true },
  otherMessage: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'projects' });
module.exports = mongoose.model('Project', ProjectSchema);
