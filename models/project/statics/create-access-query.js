const ObjectId = require("mongodb").ObjectId;

const accessLevelToAccessCode = require("./access-level-to-access-code.js");

function mapAccessLevel(role) {
  if (role === "viewer") {
    return {
      generalAccess: ["restricted"],
      userAccess: [null, "viewer", "editor", "manager"],
    };
  }

  if (role === "editor") {
    return {
      generalAccess: [],
      userAccess: ["editor", "manager"],
    };
  }

  if (role === "manager") {
    return {
      generalAccess: [],
      userAccess: ["manager"],
    };
  }

  if (role === "owner") {
    return {
      generalAccess: [],
      userAccess: [],
    };
  }

  throw new Error("Invalid role");
}

function createAccessQuery(
  role,
  userId,
) {
  const {
    generalAccess,
    userAccess,
  } = mapAccessLevel(role);

  const query = {
    $or: [],
  };

  if (userId) {
    query.$or.push({ owner: userId });
  }

  if (generalAccess.length) {
    query.$or.push({ access: { $in: generalAccess.map(accessLevelToAccessCode) } });
  }

  if (userAccess.length && userId) {
    query.$or.push({
      "shares.user": new ObjectId(userId),
      "shares.role": { $in: userAccess },
    });
  }

  return query;
}

module.exports = createAccessQuery;
