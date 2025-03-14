import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import databaseService from "../../../services/database";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "128mb",
    },
  },
};

export default async function (req, res) {
  const db = await databaseService();
  const user = await requireUserMiddleware(req, res);

  const projectModel = await db.models.Project.findByIdentifier(
    req.query?.project,
    "editor",
    user?.id,
  );

  await projectModel.saveJson(req.body);

  logger.info("project updated", { project: projectModel.id }, { user, req, res });

  return res.json({
    role: projectModel.getUserRole(user.id),
    id: projectModel.id,
    url: projectModel.url(),
  });
}
