import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import logger from "cgps-stdlib/logger/index.js";
import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";

import databaseService from "../../../services/database.js";
import findProjectByIdentifier from "../../../services/project/find-by-identifier.js";

async function handler(req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const { project, team } = req.body;

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

  logger.debug(
    { user: user.id, project: projectModel.id, team: teamModel.id },
    "removing project from team",
  );

  const shareIndex = projectModel.shares.findIndex((x) => x.kind === "team" && x.team === teamModel.id);
  if (shareIndex !== -1) {
    projectModel.shares.splice(shareIndex, 1);
    await projectModel.save();
  }
  else {
    throw new ApiError(400);
  }

  res.status(200).send(true);
}

export default catchApiErrors(handler);
