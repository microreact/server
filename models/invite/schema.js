const mongoose = require("mongoose");
const shortUUID = require("short-uuid");

const { ObjectId } = mongoose.Types;

module.exports = mongoose.Schema({
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  project: { type: ObjectId, ref: "Project" },
  team: { type: String },
  owner: { type: ObjectId, ref: "User" },
  email: { type: String },
  token: {
    default: shortUUID.generate,
    type: String,
    unique: true,
  },
  role: { type: String, default: "viewer" },
});
