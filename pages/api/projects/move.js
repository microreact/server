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

  const folderIdOrName = req.body.folder ?? null;

  const folderDocument = await ProjectsService.findOrCreateUserFolder(user, folderIdOrName);

  projectModel.folder = folderDocument._id;

  await projectModel.save();

  logger.info("project moved to folder", { project: projectModel.id, folder: folderDocument._id }, { user, req, res });

  return res.json(true);
}
