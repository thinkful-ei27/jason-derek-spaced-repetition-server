const express = require('express');
const signs = require('../db/signs');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.json({ sign: `${req.protocol}://${req.get('host')}/assets/${signs[0].sign}` });
});

module.exports = router;