const express = require('express');
const User = require('../models/user');
const signs = require('../db/signs');

const router = express.Router();

router.get('/', (req, res, next) => {
  const userId = req.user.id;
  return User.findById(userId)
    .then(user => {
      res.json({ sign: `${req.protocol}://${req.get('host')}/assets/${user.signs[0].sign}` });
    })
    .catch(err => next(err));
});

module.exports = router;