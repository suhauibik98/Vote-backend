const mongoose = require("mongoose");

const connectdb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB".bgGreen.bold);
  
    return conn;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectdb;
