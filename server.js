const express = require("express"); // server software
const bodyParser = require("body-parser"); // parser middleware
const session = require("express-session"); // session middleware
const passport = require("passport"); // authentication
const connectEnsureLogin = require("connect-ensure-login"); // authorization
const User = require("./users.json");
const LocalStrategy = require("passport-local");

const app = express();

// Configure Sessions Middleware
app.use(
  session({
    secret: "r8q,+&1LM3)CD*zAGpx1xm{NeQhc;#",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
  })
);

// Configure Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
// passport.use(User.createStrategy());

// To use with sessions
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// Route to Homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/static/index.html");
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    function (username, password, done) {
      const user = User.data.filter((user) => user.username === username);
      if (user.length !== 0) {
        if (user[0].password === password) {
          return done(null, user[0]);
        } else {
          return done(null, false);
        }
      } else {
        return done(null, false);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  done(false, User.data.filter((user) => user.id === id)[0]);
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/dashboard",
  }),
  function (req, res) {
    req.logIn();
  }
);

// Route to Login Page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/static/login.html");
});

// Route to Dashboard
app.get("/dashboard", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.send(`Hello ${req.user.username}. Your session ID is ${req.sessionID} 
  and your session expires in ${req.session.cookie.maxAge} 
  milliseconds.<br><br>
  <a href="/logout">Log Out</a><br><br>
  ${req.user.role === "admin" ? '<a href="/secret">Admins Only</a>' : ""}`);
});

// Route to Secret Page
app.get("/secret", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  if (req.user.role === "admin") {
    res.sendFile(__dirname + "/static/secret-page.html");
  } else {
    res.redirect("/logout");
  }
});

// Route to Log out
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/login");
});

// assign port
const port = 3000;
app.listen(port, () => console.log(`This app is listening on port ${port}`));
