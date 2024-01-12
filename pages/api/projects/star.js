import { ApiError } from "next/dist/server/api-utils";
import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import databaseService from "../../../services/dataabse";

export default async function (req, res) {
  const db = await databaseService();
  const user = await requireUserMiddleware(req, res);

  const projectModel = await db.models.Project.findByIdentifier(
    req.query?.project,
    "owner",
    user?.id,
  );

  const isStarred = Boolean(req.body.starred);

  if (typeof isStarred === "boolean") {
    projectModel.starred = isStarred;
  }
  else {
    throw new ApiError(400);
  }

  await projectModel.save();

  logger.info(`project ${isStarred ? "starred" : "unstarred"}`, { project: projectModel.id }, { user, req, res });

  return res.json(true);
}
