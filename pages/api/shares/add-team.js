import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import logger from "cgps-stdlib/logger/index.js";
import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";

import databaseService from "../../../services/database.js";
import projectSharingRoles from "../../../services/project/share-roles.js";
import findProjectByIdentifier from "../../../services/project/find-by-identifier.js";

async function handler(req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const { project, team, role } = req.body;

  if (typeof project !== "string" || typeof team !== "string") {
    throw new ApiError(400);
  }

  const teamModel = await db.models.Team.findOne({
    id: team,
    owner: user.id,
  });

  if (!teamModel) {
    throw new ApiError(403);
  }

  const projectModel = await findProjectByIdentifier(
    project,
    "owner",
    user.id,
  );

  if (!projectModel) {
    throw new ApiError(403);
  }

  if (!(role in projectSharingRoles)) {
    throw new ApiError(400, "invalid role");
  }

  logger.debug(
    { user: user.id, project: projectModel.id, team: teamModel.id },
    "adding project to team",
  );

  const index = projectModel.shares.findIndex((x) => x.kind === "team" && x.team === teamModel.id);
  if (index !== -1) {
    projectModel.shares[index].role = role;
  }
  else {
    projectModel.shares.push({
      "createdAt": new Date(),
      "kind": "team",
      "role": role ?? "viewer",
      "team": teamModel.id,
    });
  }

  await projectModel.save();

  res.status(200).send(true);
}

export default catchApiErrors(handler);
