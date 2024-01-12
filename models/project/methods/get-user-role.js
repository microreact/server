const accessCodeToAccessLevel = require("../statics/access-code-to-access-level.js");

function getUserRole(userId) {
  if (userId) {
    // Check if user has owner access
    if (this.owner?._id.toString() === userId) {
      return "owner";
    }

    const shareDoc = this.shares.find((share) => share?.user?._id?.toString() === userId);
    if (shareDoc?.role) {
      return shareDoc.role ?? "viewer";
    }
  }

  const generalAccessRole = accessCodeToAccessLevel(this.access);
  return generalAccessRole;
}

module.exports = getUserRole;
