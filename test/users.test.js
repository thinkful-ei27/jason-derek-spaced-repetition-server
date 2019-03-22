const { app } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');
const users = require('../db/test-users');

const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHttp);
const sandbox = sinon.createSandbox();

describe('Spaced Repetition - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const name = 'Example User';
  let user = {};
  let token;

  before(function () {
    return dbConnect(TEST_DATABASE_URL);
  });

  beforeEach(function () {
    return Promise.all([
      User.insertMany(users),
      User.createIndexes(),
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(function () {
    sandbox.restore();
    return dbDrop();
  });

  after(function () {
    return dbDisconnect();
  });

  describe('POST /api/users', function () {
    it('should create a new user with lowercase username', function () {
      let res;
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, name })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'head', 'username', 'name', 'guessesMade', 'guessesCorrect', 'learned');
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(username.toLowerCase());
          expect(res.body.name).to.equal(name);
          expect(res.body.learned).to.be.an('array');
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.name).to.equal(name);
          expect(user.signs).to.be.an('array');
          expect(user.signs[0]).to.have.keys('sign', 'answer', 'm', 'next', 'guessesMade', 'guessesCorrect');
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it('should reject users with missing username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Missing field');
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with missing password', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Missing field');
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with non-string username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username: 1234, password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with non-string password', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: 1234, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with non-string name', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, name: 1234 })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Incorrect field type: expected string'
          );
          expect(res.body.location).to.equal('name');
        });
    });

    it('should reject users with non-trimmed username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username: ` ${username} `, password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with non-trimmed password', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: ` ${password} `, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Cannot start or end with whitespace'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with empty username', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username: '', password, name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at least 1 characters long'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should reject users with password less than 10 characters', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: '123456789', name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at least 10 characters long'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with password greater than 72 characters', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: 'a'.repeat(73), name })

        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Must be at most 72 characters long'
          );
          expect(res.body.location).to.equal('password');
        });
    });

    it('should reject users with a duplicate username', function () {
      return User
        .create({
          username,
          password,
          name
        })
        .then(() => {
          return chai
            .request(app)
            .post('/api/users')
            .send({ username, password, name });
        })
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal(
            'Username already taken'
          );
          expect(res.body.location).to.equal('username');
        });
    });

    it('should trim name', function () {
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, name: ` ${name} ` })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'name', 'guessesMade', 'guessesCorrect', 'head', 'learned');
          expect(res.body.name).to.equal(name);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.not.be.null;
          expect(user.name).to.equal(name);
        });
    });
  });

  describe('GET /api/users/progress', function () {
    it('should return a user object', function () {
      return chai.request(app)
        .get('/api/users/progress')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          const req = res.request;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys( 'guessesMade', 'guessesCorrect', 'learned');
        });
    });

    it('should reject requests without authToken', function () {
      return chai.request(app)
        .get('/api/users/progress')
        .then(res => {
          expect(res).to.have.status(401);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Unauthorized');
        });
    });
  });

  describe('GET /api/users/question', function () {
    it('should return the first sign', function () {
      return chai.request(app)
        .get('/api/users/question')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          const req = res.request;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys('sign');
          expect(res.body.sign).to.equal(`${req.protocol}//${req.host}/signs/${user.signs[0].sign}`);
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(User, 'findById').throws('FakeError');

      return chai.request(app)
        .get('/api/users/question')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

  describe('POST /api/users/guess', function () {
    it('should return true when given a correct guess regardless of capitalization', function () {
      const newGuess = {
        guess: user.signs[0].answer.toUpperCase(),
      };
      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(newGuess)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('correct', 'answer', 'guessesMade', 'guessesCorrect', 'sign', 'user');
          expect(res.body.correct).to.equal(true);
          expect(res.body.answer).to.equal(newGuess.guess.toLowerCase());
          expect(res.body.guessesMade).to.equal(user.guessesMade + 1);
          expect(res.body.guessesCorrect).to.equal(user.guessesCorrect + 1);
          expect(res.body.sign.guessesMade).to.equal(user.signs[0].guessesMade + 1);
          expect(res.body.sign.guessesCorrect).to.equal(user.signs[0].guessesCorrect + 1);
        });
    });

    it('should return false when given an incorrect guess', function () {
      const badGuess = {
        guess: 'idontknow',
      };
      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(badGuess)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('correct', 'answer', 'guessesMade', 'guessesCorrect', 'sign', 'user');
          expect(res.body.correct).to.equal(false);
          expect(res.body.answer).to.not.equal(badGuess.guess);
          expect(res.body.guessesMade).to.equal(user.guessesMade + 1);
          expect(res.body.guessesCorrect).to.equal(user.guessesCorrect);
          expect(res.body.sign.guessesMade).to.equal(user.signs[0].guessesMade + 1);
          expect(res.body.sign.guessesCorrect).to.equal(user.signs[0].guessesCorrect);
          expect(res.body.user.learned).to.be.an('array');
          expect(res.body.user.learned.length).to.equal(0);
        });
    });

    it('should move to the next question after a guess', function () {
      const newGuess = {
        guess: user.signs[0].answer,
      };
      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(newGuess)
        .then(res => {
          expect(res.body.answer).to.equal(newGuess.guess);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser.signs[updatedUser.head].answer).to.not.equal(newGuess.guess);
        });
    });

    it('should present the question again sooner if the question was guessed wrong', function () {
      const badGuess = {
        guess: 'idontknow',
      };
      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(badGuess)
        .then(res => {
          expect(res.body.correct).to.equal(false);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser.head).to.equal(1);
          expect(updatedUser.signs[0].m).to.equal(1);
          expect(updatedUser.signs[0].next).to.equal(2);
          expect(updatedUser.signs[1].next).to.equal(0);
        });
    });

    it('should present the question again later if the question was guessed correctly', function () {
      const newGuess = {
        guess: user.signs[0].answer,
      };
      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(newGuess)
        .then(res => {
          expect(res.body.correct).to.equal(true);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser.head).to.equal(1);
          expect(updatedUser.signs[0].m).to.equal(2);
          expect(updatedUser.signs[0].next).to.equal(3);
          expect(updatedUser.signs[2].next).to.equal(0);
        });
    });

    it('should add the question to the end of the list if `m` is greater than the list length', function () {
      const newGuess = {
        guess: user.signs[user.head].answer,
      };
      const currSign = user.signs[user.head];
      currSign.m = 6;
      user.signs.set(user.head, currSign);
      return user.save()
        .then(() => {
          return chai.request(app)
            .post('/api/users/guess')
            .set('Authorization', `Bearer ${token}`)
            .send(newGuess);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.correct).to.equal(true);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser.head).to.equal(1);
          expect(updatedUser.signs[0].m).to.equal(12);
          expect(updatedUser.signs[0].next).to.equal(null);
          expect(updatedUser.signs[9].next).to.equal(0);
        });
    });

    it('should add the sign to the `learned` list once `m` is 16 or more', function () {
      const newGuess = {
        guess: user.signs[user.head].answer,
      };
      const currSign = user.signs[user.head];
      currSign.m = 8;
      user.signs.set(user.head, currSign);
      return user.save()
        .then(() => {
          return chai.request(app)
            .post('/api/users/guess')
            .set('Authorization', `Bearer ${token}`)
            .send(newGuess);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.correct).to.equal(true);
          expect(res.body.user.learned.length).to.equal(1);
          expect(res.body.user.learned[0].sign).to.equal(currSign.sign);
          expect(res.body.user.learned[0].guessesMade).to.equal(currSign.guessesMade + 1);
          expect(res.body.user.learned[0].guessesCorrect).to.equal(currSign.guessesCorrect + 1);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser.signs[0].m).to.equal(16);
        });
    });

    it('should update `guessesMade` and `guessesCorrect` on learned items when guessed correctly', function () {
      const newGuess = {
        guess: user.signs[user.head].answer,
      };
      const currSign = user.signs[user.head];
      currSign.m = 16;
      user.signs.set(user.head, currSign);
      user.learned.push({ sign: currSign.sign, guessesMade: currSign.guessesMade, guessesCorrect: currSign.guessesCorrect });
      return user.save()
        .then(user => {
          expect(user.learned.length).to.equal(1);
          expect(user.learned[0].guessesMade).to.equal(currSign.guessesMade);
          expect(user.learned[0].guessesCorrect).to.equal(currSign.guessesCorrect);
          return chai.request(app)
            .post('/api/users/guess')
            .set('Authorization', `Bearer ${token}`)
            .send(newGuess);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.correct).to.equal(true);
          expect(res.body.user.learned.length).to.equal(1);
          expect(res.body.user.learned[0].sign).to.equal(currSign.sign);
          expect(res.body.user.learned[0].guessesMade).to.equal(currSign.guessesMade + 1);
          expect(res.body.user.learned[0].guessesCorrect).to.equal(currSign.guessesCorrect + 1);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser.signs[0].m).to.equal(32);
        });
    });

    it('should remove the sign from the `learned` list if `m` drops below 16', function () {
      const badGuess = {
        guess: 'iforgottheanswer',
      };
      const currSign = user.signs[user.head];
      currSign.m = 16;
      user.signs.set(user.head, currSign);
      user.learned.push({ sign: currSign.sign, guessesMade: currSign.guessesMade, guessesCorrect: currSign.guessesCorrect });
      return user.save()
        .then(user => {
          expect(user.learned.length).to.equal(1);
          return chai.request(app)
            .post('/api/users/guess')
            .set('Authorization', `Bearer ${token}`)
            .send(badGuess);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.correct).to.equal(false);
          expect(res.body.user.learned.length).to.equal(0);
          return User.findOne({ username: user.username });
        })
        .then(updatedUser => {
          expect(updatedUser.signs[0].m).to.equal(1);
        });
    });

    it('should return an error when missing "guess" field', function () {
      const missingGuess = {
      };
      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(missingGuess)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `guess` in request body');
        });
    });

    it('should return an error when "guess" is an empty string', function () {
      const emptyGuess = {
        guess: '',
      };
      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(emptyGuess)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `guess` in request body');
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(User, 'findById').throws('FakeError');

      const newGuess = {
        guess: user.signs[0].answer,
      };

      return chai.request(app)
        .post('/api/users/guess')
        .set('Authorization', `Bearer ${token}`)
        .send(newGuess)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });

});