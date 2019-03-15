const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// User database
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
}

// URL database
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

// GET hello
app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET registration form
app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_register", templateVars);
});

// POST registration form
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  // Check if email already exists
  for (let userId in users) {
    if (email === users[userId].email) {
      res.status(400).send("Forbidden");
    }
  }

  // Add in user to database
  users[id] = {
    id,
    email,
    password
  }

  // Test for cookie after registration
  res.cookie("user_id", id);
  console.log(users);

  // Check for registration errors
  if (!email || !password) {
    res.status(400).send("Forbidden");
    return;
  } else {
    res.redirect("/urls");
  }
});

// GET login form
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    urls: urlsForUser(req.cookies.user_id)
  };
  res.render("urls_login", templateVars);
});

// POST login form
app.post("/login", (req, res) => {
  const user = emailLookup(req.body.email);

  // Check for login errors
  if (user === null || req.body.password !== user.password) {
    res.status(403).send("Forbidden");
    return;
  } else {
    // Add cookie if valid login
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }
});

// Add random short URL and its long URL to URL database
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    urls: urlsForUser(req.cookies.user_id)
  };
  res.render("urls_index", templateVars);
});

// GET long URL from user
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// GET short URL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

// Get JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Get hello world
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// POST random short URL to match user's long URL
app.post("/urls", (req, res) => {
  if (users[req.cookies.user_id]) {
    const randomStr = generateRandomString();
    urlDatabase[randomStr] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id
    };
    res.redirect(`/urls/${randomStr}`);
  } else {
    res.status(403).end();
  }
});

// POST updated long URL
app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).end();
  }
});

// POST URL removal
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).end();
  }
});

// POST logout and remove cookies
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Redirect user to long URL link regardless of login or logout
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Boot server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Generate string of 6 random alphanumeric characters
function generateRandomString() {
  let text = "";
  let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += str.charAt(Math.floor(Math.random() * str.length));
  }
  return text;
}

// Email lookup helper function
function emailLookup(email) {
  for (let id in users) {
    if (users[id].email === email) {
      return users[id];
    }
  }
  return null;
}

// User lookup helper function
function urlsForUser(id) {
  let urls = { };
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
}