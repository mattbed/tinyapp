const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { emailLookup, generateRandomString, urlsForUser, urlHTTP } = require('./helpers');

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

// home page get
app.get("/", (req, res) => {
  // redirect to /urls if a cookie is detected, otherwise redirects to /login
  if (req.session['user_id']) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

// user login page get
app.get("/login", (req, res) => {
  // redirect to /urls if a cookie is detected, otherwise displays login page
  if (req.session['user_id']) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: req.session['user_id'],
  };
  res.render("login", templateVars);
});

// user login post
app.post("/login", (req, res) => {
  // checks if email is found in the database, then checks if the password matches
  const userID = emailLookup(req.body.email, users);
  if (!userID) {
    return res.status(403).send("Email not found");
  } else if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send("Incorrect password");
  }
  // sets cookie if both checks are passed and redirects to /urls
  req.session['user_id'] = users[userID];
  res.redirect("/urls");
});

// user logout post
app.post("/logout", (req, res) => {
  // sets cookie to null then redirects to /urls
  req.session['user_id'] = null;
  res.redirect("/urls");
});

// register page get
app.get("/register", (req, res) => {
  // redirects to /urls if a cookie is detected, otherwise displays register page
  if (req.session['user_id']) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: req.session['user_id'],
  };
  res.render("register", templateVars);
});

// register page post
app.post("/register", (req, res) => {
  // ensures that both fields were filled in when submitting, then checks if email was already registered
  if (!(req.body.email && req.body.password)) {
    return res.status(400).send('Please enter a valid email and password');
  }
  if (emailLookup(req.body.email, users)) {
    return res.status(400).send('Email is already registered');
  }
  // if both checks are passed, creates unique id and assigns that with the submitted email and password to the user database
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  users[id] = { id, email, password };
  // sets a cookie and redirects to /urls
  req.session['user_id'] = users[id];
  res.redirect("/urls");
});

// URLs page get
app.get("/urls", (req, res) => {
  // creates a new object containing the urls that match the id of the user that is logged in
  let urlObj = {};
  if (req.session['user_id']) {
    urlObj = urlsForUser(req.session['user_id'].id, urlDatabase);
  }
  // displays the /urls page with only the urls that the user is permitted to see
  const templateVars = {
    user: req.session['user_id'],
    urls: urlObj,
  };
  res.render("urls_index", templateVars);
});

// create new URLs page post
app.post("/urls", (req, res) => {
  // checks to ensure you are logged in
  if (!req.session['user_id']) {
    return res.status(403).send('Please login or register first');
  }
  // appends http:// to long url if needed, generates new short url
  const longURLVar = urlHTTP(req.body.longURL);
  const shortURL = generateRandomString();
  // creates new short url object in the database, then redirects to the corresponding page for the new url
  urlDatabase[shortURL] = {
    longURL: longURLVar,
    userID: req.session['user_id'].id,
  };
  res.redirect(`/urls/${shortURL}`);
});

// create new URL page get
// 
app.get("/urls/new", (req, res) => {
  // redirects to /login if no cookie is detected, otherwise loads /urls_new
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
  // checks for a cookie || checks if your cookie does not match the id of the affected url
  const shortURLVar = req.params.shortURL;
  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortURLVar].userID) {
    return res.status(403).send('Oops! You are not permitted to edit this link');
  }
  // if checks pass, deletes the requested url and redirects to /urls
  delete urlDatabase[shortURLVar];
  res.redirect("/urls");
});

// Edit URLs page get
app.get("/urls/:shortURL", (req, res) => {
  // checks for a cookie || checks if your cookie does not match the id of the affected url
  const shortURLVar = req.params.shortURL;
  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortURLVar].userID) {
    return res.status(403).send('Oops! You are not permitted to edit this link');
  }
  // checks if the short url id exists
  if (!urlDatabase[shortURLVar]) {
    return res.status(404).send("The dreaded 404 file not found");
  }
  // if all checks are passed, loads up /urls_show
  const templateVars = {
    user: req.session['user_id'],
    shortURL: shortURLVar,
    longURL: urlDatabase[shortURLVar].longURL,
  };
  res.render("urls_show", templateVars);
});

// Edit url page post
app.post("/urls/:shortURL", (req, res) => {
  // checks for a cookie || checks if your cookie does not match the id of the affected url
  const shortURLVar = req.params.shortURL;
  if (!req.session['user_id'] || req.session['user_id'].id !== urlDatabase[shortURLVar].userID) {
    return res.status(403).send('Oops! You are not permitted to edit this link');
  }
  // if all checks are passed, appends input url with http:// if necessary, updates object with the new url, and redirects to /urls
  const longURLVar = urlHTTP(req.body.longURL);
  urlDatabase[shortURLVar].longURL = longURLVar;
  res.redirect("/urls");
});

// redirects short URLs to their longURLs
app.get("/u/:shortURL", (req, res) => {
  // checks if the short url id is accurate, then redirects to it if passed
  const shortURLVar = req.params.shortURL;
  if (!urlDatabase[shortURLVar]) {
    return res.status(404).send("The dreaded 404 file not found");
  }
  const longURL = urlDatabase[shortURLVar].longURL;
  res.redirect(longURL);
});

// ,.~+* }o{  -- Hey! Listen!
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}~`);
});