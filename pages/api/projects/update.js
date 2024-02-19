import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import { ApiError } from "next/dist/server/api-utils";
import logger from "cgps-application-server/logger";

import * as ProjectsService from "../../../services/projects";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
  },
};

export default async function (req, res) {
  const user = await requireUserMiddleware(req, res);

  const projectModel = await ProjectsService.getProjectDocument(req.query?.project, user);

  if (!projectModel.hasOnwerAccess(user)) {
    throw new ApiError(403);
  }

  await projectModel.saveJson(req.body);

  logger.info("project updated", { project: projectModel.id }, { user, req, res });

  return res.json({
    isOwner: true,
    id: projectModel.id,
    url: projectModel.url(),
  });
}
