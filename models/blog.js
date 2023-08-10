const mongoose = require("mongoose");
const postSchema = {
  title: String,
  author: String,
  content: String, 
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
};
module.exports = mongoose.model("Post", postSchema);
