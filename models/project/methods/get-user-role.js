const accessCodeToAccessLevel = require("../statics/access-code-to-access-level.js");

const rolePriority = {
  manager: 3,
  editor: 2,
  viewer: 1,
};

function getUserRole(userId, userTeamsIds = []) {
  if (userId) {
    // Check if user has owner access
    if (this.owner?._id.toString() === userId) {
      return "owner";
    }

    let bestRole = null;

    for (const share of this.shares || []) {
      if (share?.user?._id?.toString() === userId) {
        const role = share.role ?? "viewer";
        if (!bestRole || (rolePriority[role] || 0) > (rolePriority[bestRole] || 0)) {
          bestRole = role;
        }
      }
      else if (share?.kind === "team" && share?.team && userTeamsIds.includes(share.team)) {
        const role = share.role ?? "viewer";
        if (!bestRole || (rolePriority[role] || 0) > (rolePriority[bestRole] || 0)) {
          bestRole = role;
        }
      }
    }

    if (bestRole) {
      return bestRole;
    }
  }

  const generalAccessRole = accessCodeToAccessLevel(this.access);
  return generalAccessRole;
}

module.exports = getUserRole;
