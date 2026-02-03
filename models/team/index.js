const mongoose = require("mongoose");

const schema = require("./schema");

schema.statics.teamUrl = require("./statics/team-url");

schema.methods.url = function url() {
  return schema.statics.teamUrl(this.id, this.name);
};

module.exports = mongoose.models.Team || mongoose.model("Team", schema);
