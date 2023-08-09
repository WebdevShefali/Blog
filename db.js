const mongoose = require("mongoose");
const connectToMongo = () => {
  mongoose.connect("mongodb://localhost:27017/blogDB", {
    useNewUrlParser: true,
  });
};
module.exports = connectToMongo;
