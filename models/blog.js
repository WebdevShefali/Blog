const mongoose = require("mongoose");
const postSchema = {
  title: String,
  author: String,
  content: String,
};
module.exports = mongoose.model("Post", postSchema);
