const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const { app } = require('../index');
const User = require('../models/user');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { dbConnect, dbDisconnect, dbDrop } = require('../db-mongoose');
const users = require('../db/test-users');

chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

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
    sandbox.restore();
    return dbDrop();
  });

  after(() => dbDisconnect());

  describe('GET /api/signs', function () {
    it('should return the first sign', function () {
      return chai.request(app)
        .get('/api/signs')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          const req = res.request;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys('sign');
          expect(res.body.sign).to.equal(`${req.protocol}//${req.host}/assets/${user.signs[0].sign}`);
        });
    });

    it('should catch errors and respond properly', function () {
      sandbox.stub(User, 'findById').throws('FakeError');

      return chai.request(app)
        .get('/api/signs')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Internal Server Error');
        });
    });
  });
});