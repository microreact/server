import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import database from "../../../services/database";

async function handler(req, res) {
  // Only logged in users can create projects
  const user = await requireUserMiddleware(req, res);

  if (typeof req.body.name !== "string" || req.body.name.length < 8) {
    return res.status(400).json({ error: "Team name must be at least 8 characters long" });
  }

  const db = await database();

  const newTeam = new db.models.Team();

  newTeam.owner = user.id;

  newTeam.name = req.body.name;

  await newTeam.save();

  logger.info("team created", { team: newTeam.id }, { user, req, res });

  return res.json({
    id: newTeam.id,
    url: newTeam.url(),
  });
}

export default handler;
