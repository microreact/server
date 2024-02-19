const mongoose = require("mongoose");
const shortUUID = require("short-uuid");

const { ObjectId } = mongoose.Types;

const projectSchemaVersion = 2;

const shareSchema = new mongoose.Schema(
  {
    createdAt: { type: Date },
    kind: { type: String },

    // createdAt: { type: Date },
    // kind: { type: String },
    // user: { type: ObjectId },
    // email: { type: String },
    // token: { type: String },
  },
  {
    discriminatorKey: "kind",
    _id: false,
  },
);

const projectSchema = new mongoose.Schema({
  alias: { type: String },
  access: {
    type: Number,
    default: 0,
  },
  binned: { type: Boolean },
  createdAt: { type: Date },
  folder: { type: ObjectId, ref: "Folder" },
  id: {
    default: shortUUID.generate,
    type: String,
    unique: true,
  },
  json: { type: Object },
  // linkedProjectId: { type: String },
  owner: { type: ObjectId, ref: "User" },
  shares: [ shareSchema ],
  starred: { type: Boolean },
  updatedAt: { type: Date },
  version: { type: Number, default: projectSchemaVersion },
  viewsCount: { type: Number, default: 0 },
});

projectSchema
  .path("shares")
  .discriminator(
    "user",
    new mongoose.Schema(
      {
        createdAt: { type: Date },
        user: { type: ObjectId, ref: "User" },
        token: { type: String },
      },
      { _id: false },
    ),
  );

projectSchema
  .path("shares")
  .discriminator(
    "invitation",
    new mongoose.Schema(
      {
        createdAt: { type: Date },
        email: { type: String },
        token: { type: String },
      },
      { _id: false },
    ),
  );

module.exports = projectSchema;

module.exports.projectSchemaVersion = projectSchemaVersion;
