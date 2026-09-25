const express = require('express');
const { Inquiry } = require('../models');

const router = express.Router();

router.post('/', async (req, res) => {
  const { question, email } = req.body;
  if (!question || !email) {
    return res.status(400).json({ error: 'question and email are required' });
  }

  const inquiry = await Inquiry.create({ question, email });
  res.status(201).json(inquiry);
});

module.exports = router;
