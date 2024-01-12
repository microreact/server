/* eslint-disable import/newline-after-import */

const mongoose = require("mongoose");

const schema = require("./schema");

schema.pre("save", require("./hooks/pre-save"));

schema.statics.projectUrl = require("./statics/project-url");
schema.statics.imageUrl = require("./statics/image-url");
schema.statics.findByIdentifier = require("./statics/find-by-identifier");
schema.statics.createAccessQuery = require("./statics/create-access-query");

schema.methods.getUserRole = require("./methods/get-user-role");
schema.methods.saveJson = require("./methods/save-json");
schema.methods.updateStats = require("./methods/update-stats");
schema.methods.url = function url() {
  return schema.statics.projectUrl(this.version, this.id, this.json.meta.name);
};
schema.methods.aliasUrl = function aliasUrl() {
  return schema.statics.projectUrl(this.version, this.alias);
};

module.exports = mongoose.models.Project || mongoose.model("Project", schema);
