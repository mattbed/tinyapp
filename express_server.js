const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// random string generator for shortURL
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

// create new URLs page get
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// list of new URLs page get
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// create new URLs page post
app.post("/urls", (req, res) => {
  const longURLObj = req.body;
  if (!longURLObj['longURL'].includes("http://")) {
    longURLObj['longURL'] = "http://" + longURLObj['longURL'];
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURLObj['longURL'];
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

// 
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// 
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