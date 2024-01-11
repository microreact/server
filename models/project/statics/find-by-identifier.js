const ApiError = require("cgps-stdlib/errors/api-error.js").default;

/**
 * Finds a project documents by project ID or project slug.
 * @param  {string} projectIdOrSlug - The shortened v4 UUID of the project, or its slug
 * @param  {UserModel} user - The signed-in user, or null for anonymous users
 * @return {ProjectModel} A Project model if the project is found and the user has access to it, otherwise throws an ApiError.
 * @throws {ApiError} 400 Invalid Request: if the project ID is invalid.
 * @throws {ApiError} 404 Not Found: if the project is not found.
 * @throws {ApiError} 401 Unauthorized: if the project is not public and the user is anonymous.
 * @throws {ApiError} 403 Forbidden: if the project is not public and the signed-in user does not have access.
*/
async function findByIdentifier(
  identifier,
  role,
  userId,
) {
  if (!identifier) {
    throw new ApiError(400, "Invalid Request");
  }

  const accessQuery = this.createAccessQuery(
    role,
    userId,
  );

  const idQuery = {
    "$or": [
      { id: identifier },
      { alias: identifier },
    ],
  };

  const model = await this.findOne({
    "$and": [
      idQuery,
      accessQuery,
    ],
  });

  if (!model) {
    const baseModel = await this.findOne(idQuery);
    if (baseModel) {
      if (userId) {
        throw new ApiError(403, "Forbidden");
      }
      else {
        throw new ApiError(401, "Unauthorized");
      }
    }
    else {
      throw new ApiError(404, "Not Found");
    }
  }

  return model;
}

module.exports = findByIdentifier;
