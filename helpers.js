// email lookup returns - input parameters are email and database
// returns paired user id if match, returns undefined if no match
const emailLookup = (email, db) => {
  for (let userID of Object.keys(db)) {
    if (db[userID].email === email) {
      return userID;
    }
  }
  return undefined;
};

// random string generator for shortURL (6 alphanumeric characters - no checks for duplication)
function generateRandomString() {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString;
  for (let i = 0; i < 6; i++) {
    let index = Math.floor(Math.random() * 62);
    if (!randomString) {
      randomString = characters[index];
    } else {
      randomString += characters[index];
    }
  }
  return randomString;
};

// sorts urls created by user
const urlsForUser = (id, db) => {
  if (!id) {
    return undefined;
  }
  let output = {};
  for (let element of Object.keys(db)) {
    if (db[element].userID === id) {
      output[element] = db[element];
    }
  }
  return output;
};

module.exports = { emailLookup, generateRandomString, urlsForUser };