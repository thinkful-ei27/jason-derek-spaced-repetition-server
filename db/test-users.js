const signs = require('./signs');

const users = [
  {
    _id: '000000000000000000000001',
    name: 'Ana User',
    username: 'anauser',
    signs: signs,
    password: '$2a$10$O4tYSlkzFykwKYIXIaKFXOjKYzfrwjSZmOak50rMpzhWW/aKHA06a' // "password"
  },
  {
    _id: '000000000000000000000002',
    name: 'Bob User',
    username: 'bobuser',
    signs: signs,
    password: '$2a$10$vXjjefbggXMi5S9130.Zu.AMcQoh2TqikDOmKn/7B6hpW6l8gX56W' // "baseball"
  },
];

module.exports = users;