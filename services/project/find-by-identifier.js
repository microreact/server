import projectSlugToId from "cgps-stdlib/urls/parse-slug.js";
import ApiError from "cgps-stdlib/errors/api-error.js";

import createAccessQuery from "./create-access-query.js";
import findUserTeamIds from "../users/find-user-team-ids.js";
import databaseService from "../database.js";

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
async function findProjectByIdentifier(
  projectIdOrSlug,
  role,
  userId,
) {
  const db = await databaseService();

  if (!projectIdOrSlug) {
    throw new ApiError(400, "Invalid Request");
  }
  const identifier = projectSlugToId(projectIdOrSlug);

  const userTeamsIds = await findUserTeamIds(userId);

  const accessQuery = createAccessQuery(
    role,
    userId,
    userTeamsIds,
  );

  const idQuery = {
    "$or": [
      { id: identifier },
      { alias: projectIdOrSlug },
    ],
  };
  const model = await db.models.Project.findOne(
    {
      "$and": [
        idQuery,
        accessQuery,
      ],
    }
  );

  if (!model) {
    const baseModel = await db.models.Project.findOne(idQuery);
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
export default findProjectByIdentifier;
