const express = require('express');
const signs = require('../db/signs');

const router = express.Router();

router.get('/', (req, res, next) => {
  res.json({ sign: signs[0] });
});

module.exports = router;