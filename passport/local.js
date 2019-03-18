const { Strategy: LocalStrategy } = require('passport-local');

const User = require('../models/user');

const localStrategy = new LocalStrategy((username, password, done) => {
  let user;
  User.findOne({ username })
    .then(results => {
      user = results;
      return user.validatePassword(password);
    })
    .then(isValid => {
      return done(null, user);
    })
    .catch(err => done(err));
});

module.exports = localStrategy;