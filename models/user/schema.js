const mongoose = require("mongoose");

module.exports = mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  name: { type: String },
  email: { type: String },
  image: { type: String },
  updatedAt: { type: Date },
});
