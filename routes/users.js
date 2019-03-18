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
  const stringFields = ['name', 'password', 'username'];
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

const validateTrimmedFields = (req, res, next) => {
  const explicitlyTrimmedFields = ['username', 'password'];
  const fieldsToTest = explicitlyTrimmedFields.filter(field => field in req.body);
  const nonTrimmedField = fieldsToTest.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error('Cannot start or end with whitespace');
    err.status = 422;
    err.reason = 'ValidationError';
    err.location = nonTrimmedField;
    return next(err);
  } else {
    return next();
  }
};

router.post('/',
  // validateStringFields must go before createDigest to ensure createDigest gets a string
  validateStringFields,
  validateTrimmedFields,
  createDigest,
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