import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import dataabse from "../../../services/dataabse";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
  },
};

export default async function (req, res) {
  // Only logged in users can create projects
  const user = await requireUserMiddleware(req, res);

  const db = await dataabse();

  const projectModel = new db.models.Project();

  projectModel.owner = user.id;

  // if (req.query.linkedProjectId) {
  //   const linkedProjectModel = await ProjectsService.getProjectDocument(req.query.linkedProjectId, user);
  //   projectModel.linkedProjectId = linkedProjectModel.linkedProjectId ?? linkedProjectModel.id;
  // }

  if (req.query.access === "private") {
    projectModel.access = 0;
  }
  else {
    projectModel.access = 1;
  }

  await projectModel.saveJson(req.body);

  logger.info("project created", { project: projectModel.id }, { user, req, res });

  return res.json({
    isOwner: true,
    id: projectModel.id,
    url: projectModel.url(),
  });
}
