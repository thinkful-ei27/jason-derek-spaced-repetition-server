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

const validateStringFields = (req, res, next) => {
  const stringFields = ['username'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    const err = new Error('Incorrect field type: expected string');
    err.status = 422;
    err.reason = 'ValidationError';
    err.location = nonStringField;
    return next(err);
  } else {
    return next();
  }
};

router.post('/',
  createDigest,
  validateStringFields,
  (req, res, next) => {
    const requiredFields = ['password', 'username'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
      const err = new Error('Missing field');
      err.status = 422;
      err.reason = 'ValidationError';
      err.location = missingField;
      return next(err);
    }

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