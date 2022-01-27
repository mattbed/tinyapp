const { assert } = require('chai');
const { emailLookup, generateRandomString, urlsForUser } = require('../helpers.js');


const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testDB = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  }
};

describe('emailLookup', function() {
  
  it('should return a user with valid email', function() {
    const user = emailLookup("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });

  it('should return undefined with invalid email', function() {
    const user = emailLookup("imadethisup@example.com", testUsers)
    const expectedUserID = undefined;
    assert.equal(user, expectedUserID);
  });
});

describe('generateRandomString', function() {
  
  it('should return a string of alphanumeric characters', function() {
    const random = generateRandomString();
    const allCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    assert.includeMembers(allCharacters.split(''), random.split(''));
  });

  it('should return a string', function() {
    const random = generateRandomString();
    assert.isString(random);
  });

  it('should return a string that is 6 characters long', function() {
    const random = generateRandomString();
    assert.lengthOf(random, 6);
  });
});

describe('urlsForUser', function() {

  it('should return an object containing only the elements that have a matching userId', function() {
    const expectedOutput = { "b2xVn2": {
      longURL: "http://www.lighthouselabs.ca",
      userID: "userRandomID",
      },
    }
    const test = urlsForUser("userRandomID", testDB);
    assert.deepEqual(expectedOutput, test);
  });
  it('should return an empty object if no userID matches are found', function() {
    const expectedOutput = {}
    const test = urlsForUser("userRandomID42", testDB);
    assert.deepEqual(expectedOutput, test);
  });
});