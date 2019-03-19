const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { app } = require('../index');
const User = require('../models/user');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');
const users = require('../db/test-users');
const signs = require('../db/signs');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Spaced Repetition - Signs', function () {
  let user = {};
  let token;

  before(() => dbConnect(TEST_DATABASE_URL));

  beforeEach(() => {
    return Promise.all([
      User.insertMany(users),
      User.createIndexes(),
    ])
      .then(([users]) => {
        user = users[0];
        token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
      });
  });

  afterEach(() => {
    return dbDrop();
  });

  after(() => dbDisconnect());

  describe('GET /api/signs', function () {
    it('should return the first sign', function () {
      return chai.request(app)
        .get('/api/signs')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys('sign');
          expect(res.body.sign).to.equal(signs[0]);
        });
    });

    it('should catch errors and respond properly');
  });
});