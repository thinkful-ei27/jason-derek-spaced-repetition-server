const express = require('express');

const User = require('../models/user');

const router = express.Router();

const createDigest = (req, res, next) => {
  const { password } = req.body;
  if (password) {
    User.hashPassword(password)
      .then(digest => {
        req.body.digest = digest;
        return next();
      });
  } else {
    return next();
  }
};

router.post('/',
  createDigest,
  (req, res, next) => {
    let { digest, name, username } = req.body;

    return User
      .create({
        name,
        password: digest,
        username,
      })
      .then(user => res.status(201).json(user))
      .catch(err => next(err));
  });

module.exports = router;