const express = require('express');
const router = express.Router();

router.post('/mock', (req, res) => {
  // simple mock approval
  return res.json({ approved: true, transactionId: 'MOCK-' + Date.now() });
});

module.exports = router;
