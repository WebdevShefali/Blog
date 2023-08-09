require("dotenv").config();
const mongoose = require("mongoose");
const connectToMongo = () => {
  mongoose.connect(process.env.mongoURI, {
    useNewUrlParser: true,
  });
};
module.exports = connectToMongo;
