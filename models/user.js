const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = mongoose.Schema({
  username: { type: String, lowercase: true, required: true, unique: true, },
  password: { required: true, type: String, },
  name: String,
  signs: [Object],
  head: { type: Number, default: 0 },
  guessesMade: { type: Number, default: 0 },
  guessesCorrect: { type: Number, default: 0 },
  learned: [Object],
});

schema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
    delete result.password;
    delete result.signs;
  }
});

schema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

schema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', schema);