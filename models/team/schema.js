const mongoose = require("mongoose");
const shortUUID = require("short-uuid");

const { ObjectId } = mongoose.Types;

const membersSchema = new mongoose.Schema(
  {
    createdAt: { type: Date },
    user: { type: ObjectId, ref: "User" },
    role: { type: String, default: "viewer" },
  },
  { _id: false },
);

module.exports = mongoose.Schema({
  createdAt: { type: Date },
  id: {
    default: shortUUID.generate,
    type: String,
    unique: true,
  },
  name: { type: String },
  owner: { type: ObjectId, ref: "User" },
  members: {
    default: [],
    type: [ membersSchema ],
  },
});
