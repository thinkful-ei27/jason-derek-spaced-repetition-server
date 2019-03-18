const { app } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL } = require('../config');