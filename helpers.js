const emailLookup = (email, db) => {
  for (let userID of Object.keys(db)) {
    if (db[userID].email === email) {
      return userID;
    }
  }
  return undefined;
};

module.exports = { emailLookup }