//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const connectToMongo = require("./db");
const User = require("./models/user");
const Post = require("./models/blog");
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
//Route for posts page
app.get("/home", function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("home", {
      posts: posts,
    });
  });
});
// Route for displaying logged-in user's posts
app.get("/userPosts", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  try {
    const userPosts = await Post.find({ id: req.session.user._id });
    res.render("userPosts", {
      userPosts: userPosts,
    });
  } catch (error) {
    res.redirect("/home");
  }
});

// Route for editing a post
app.get("/edit/:postId", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  try {
    const postId = req.params.postId;
    const post = await Post.findOne({ _id: postId });

    if (!post) {
      return res.redirect("/home");
    }

    res.render("edit", {
      post: post,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/home");
  }
});

// Update the post in the database
app.post("/edit/:postId", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  try {
    const postId = req.params.postId;
    await Post.updateOne(
      { _id: postId },
      {
        $set: {
          title: req.body.postTitle,
          content: req.body.postBody,
        },
      }
    );

    res.redirect("/home");
  } catch (error) {
    console.error(error);
    res.redirect("/home");
  }
});

// Delete a post
app.get("/delete/:postId", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  const postId = req.params.postId;

  try {
    const post = await Post.findOne({ _id: postId });

    if (!post || post.id.toString() !== req.session.user._id.toString()) {
      return res.redirect("/home");
    }

    await post.remove();

    res.redirect("/userPosts");
  } catch (error) {
    console.error(error);
    res.redirect("/home");
  }
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
    author: req.session.user.name,
    content: req.body.postBody,
    id: req.session.user._id,
  });

  post.save(function (err) {
    if (!err) {
      res.redirect("/home");
    }
  });
});

app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
