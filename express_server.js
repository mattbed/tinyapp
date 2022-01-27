const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const { emailLookup } = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['X0BYyKPSFH', '9Rl8A5NesE'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// test url database
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  }
};

// test users database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

// random string generator for shortURL
// module this?
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
// module this?
const urlsForUser = (id) => {
  if (!id) {
    return undefined;
  }
  let output = {};
  for (let element of Object.keys(urlDatabase)) {
    if (urlDatabase[element].userID === id) {
      output[element] = urlDatabase[element];
    }
  }
  return output;
};

// home page get
// fix to redirect to /urls
app.get("/", (req, res) => {
  res.send("Hello!");
});

// user login page get
app.get("/login", (req, res) => {
  if (req.session['user_id']) {
    return res.redirect("/urls");
  };
  const templateVars = {
    user: req.session['user_id'],
  };
  res.render("login", templateVars);
});

// user login post
app.post("/login", (req, res) => {
  userID = emailLookup(req.body.email, users);
  if (!userID) {
    return res.status(403).send("Email not found");
  } else if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send("Incorrect password");
  }
  req.session['user_id'] = users[userID];
  res.redirect("/urls");
});

// user logout post
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect("/urls");
});

// register page get
app.get("/register", (req, res) => {
  if (req.session['user_id']) {
    return res.redirect("/urls");
  };
  const templateVars = {
    user: req.session['user_id'],
  };
  res.render("register", templateVars);
});

// register page post
app.post("/register", (req, res) => {
  if (!(req.body.email && req.body.password)) {
    return res.status(400).send('Please enter a valid email and password');
  }
  if (emailLookup(req.body.email, users)) {
    return res.status(400).send('Email is already registered');
  }
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  users[id] = { id, email, password };
  req.session['user_id'] = users[id];
  res.redirect("/urls");
});

// URLs page get
app.get("/urls", (req, res) => {
  let urlObj = {}
  if (req.session['user_id']) {
    urlObj = urlsForUser(req.session['user_id'].id);
  };
  const templateVars = { 
    user: req.session['user_id'],
    urls: urlObj,
  };
  res.render("urls_index", templateVars);
});

// create new URLs page post
app.post("/urls", (req, res) => {
  if (!req.session['user_id']) {
    return res.status(403).send('Please login or register first');
  }
  const longURLObj = req.body;
  if (!longURLObj['longURL'].includes("http://")) {
    longURLObj['longURL'] = "http://" + longURLObj['longURL'];
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: longURLObj['longURL'], userID: req.session['user_id'].id,};
  res.redirect(`/urls/${shortURL}`);
});

// create new URL page get
app.get("/urls/new", (req, res) => {
  if (!req.session['user_id']) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: req.session['user_id'],
  };
  res.render("urls_new", templateVars);
});

// delete URLs page post
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session['user_id']) {
    return res.redirect("/login");
  }
  if (req.session['user_id'].id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('Oops! You are not permitted to edit this link');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Edit URLs page get
app.get("/urls/:shortURL", (req, res) => {
  if (!req.session['user_id']) {
    return res.redirect("/login");
  }
  if (req.session['user_id'].id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('Oops! You are not permitted to edit this link');
  }
  const templateVars = {
    user: req.session['user_id'],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
  };
  res.render("urls_show", templateVars);
});

// Edit url page post
app.post("/urls/:shortURL", (req, res) => {
  if (!req.session['user_id']) {
    return res.redirect("/login");
  }
  if (req.session['user_id'].id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(403).send('Oops! You are not permitted to edit this link');
  }
  const longURLObj = req.body;
  if (!longURLObj['longURL'].includes("http://")) {
    longURLObj['longURL'] = "http://" + longURLObj['longURL'];
  }
  urlDatabase[req.params.shortURL].longURL = longURLObj['longURL'];
  res.redirect(`/urls/${req.params.shortURL}`);
});

// redirects short URLs to their longURLs
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("The dreaded 404 file not found");
  };
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// trash? 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// trash?
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// ,.~' }*{ Hey! Listen!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}~`);
});