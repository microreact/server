import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import * as ProjectsService from "../../../services/projects";
import databaseService from "../../../services/database";

export default async function (req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const projectModel = await db.models.Project.findByIdentifier(
    req.query?.project,
    "owner",
    user?.id,
  );

  const folderIdOrName = req.body.folder ?? null;

  const folderDocument = await ProjectsService.findOrCreateUserFolder(user, folderIdOrName);

  projectModel.folder = folderDocument._id;

  await projectModel.save();

  logger.info("project moved to folder", { project: projectModel.id, folder: folderDocument._id }, { user, req, res });

  return res.json(true);
}
