import { ApiError } from "next/dist/server/api-utils";
import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import * as ProjectsService from "../../../services/projects";

export default async function (req, res) {
  const user = await requireUserMiddleware(req, res);

  const projectModel = await ProjectsService.getProjectDocument(req.query?.project, user);

  if (!projectModel.hasOnwerAccess(user)) {
    throw new ApiError(403);
  }

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
