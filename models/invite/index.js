const mongoose = require("mongoose");

const schema = require("./schema");

module.exports = mongoose.models.Invite || mongoose.model("Invite", schema);
