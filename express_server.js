const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// test url database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// test users database
const users = { 
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

// find email function
// module this!
const emailLookup = (email) => {
  for (let userID of Object.keys(users)) {
    if (users[userID].email === email) {
      return userID;
    }
  }
  return undefined;
};

// random string generator for shortURL
// module this
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

// home page get
app.get("/", (req, res) => {
  res.send("Hello!");
});

// username login field post
//app.post("/login", (req, res) => {
  // const templateVars = {
  //   user: users.id,
  // };
//  res.redirect("/urls", templateVars);
//});

// username logout field post
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

// register page get
app.get("/register", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("register", templateVars);
});

// register page post
app.post("/register", (req, res) => {
  if (!(req.body.email && req.body.password)) {
    return res.status(400).send('Please enter a valid email and password');
  }
  if (emailLookup(req.body.email)) {
    return res.status(400).send('Email is already registered');
  }
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  users.id = { id, email, password };
  res.cookie('user_id', users.id);
  res.redirect("/urls");
});

// login page get
app.get("/login", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("login", templateVars);
});

// create new URLs page get
app.get("/urls", (req, res) => {
  const templateVars = { 
    user: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// create new URLs page post
app.post("/urls", (req, res) => {
  const longURLObj = req.body;
  if (!longURLObj['longURL'].includes("http://")) {
    longURLObj['longURL'] = "http://" + longURLObj['longURL'];
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURLObj['longURL'];
  res.redirect(`/urls/${shortURL}`);
});

// list of new URLs page get
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("urls_new", templateVars);
});

// delete URLs page post
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// update existing url Edit page
app.post("/urls/:shortURL", (req, res) => {
  const longURLObj = req.body;
  if (!longURLObj['longURL'].includes("http://")) {
    longURLObj['longURL'] = "http://" + longURLObj['longURL'];
  }
  urlDatabase[req.params.shortURL] = longURLObj['longURL'];
  res.redirect(`/urls/${req.params.shortURL}`);
});

// Edit URLs page get
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

// redirects short URLs to their longURLs
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
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

//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}~`);
});