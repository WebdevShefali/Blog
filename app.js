//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const connectToMongo = require("./db");
const Post = require("./models/blog");
const User = require("./models/user");
const bcrypt = require("bcrypt");
const session = require("express-session");
const PORT = process.env.PORT || 8000;

connectToMongo();

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// Express-session
app.use(
  session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true,
  })
);
// Middleware to set user data in locals
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  next();
});
//Route for posts page
app.get("/home", function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("home", {
      posts: posts,
    });
  });
});
//Route for single post page
app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;
  Post.findOne({ _id: requestedPostId }, function (err, post) {
    res.render("post", {
      title: post.title,
      author: post.author,
      content: post.content,
    });
  });
});
//Route for post compose page
app.get("/compose", function (req, res) {
  res.render("compose");
});

app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.postTitle,
    author: req.body.postAuthor,
    content: req.body.postBody,
  });

  post.save(function (err) {
    if (!err) {
      res.redirect("/home");
    }
  });
});
//Route for register page
app.post("/register", async (req, res) => {
  let salt = await bcrypt.genSalt(10);
  let secpass = await bcrypt.hash(req.body.password, salt);
  try {
  
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: secpass,
    });
    await newUser.save();
    req.session.user = newUser;
    res.redirect("/home");
  } catch (error) {
    res.redirect("/register");
  }
});
//Route for login page
app.post("/", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });
    let passwordCompare = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordCompare) {
      res.redirect("/");
    }
    req.session.user = user;
    res.redirect("/home");
  } catch (error) {
    res.redirect("/");
  }
});

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
