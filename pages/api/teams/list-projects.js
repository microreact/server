import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import * as ProjectsService from "../../../services/projects";
import databaseService from "../../../services/database";

export default async function (req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const teamId = req.query.team;

  if (!teamId) {
    res.status(400).send("team query parameter is required");
  }
  const teamModel = await db.models.Team.findOne({
    "id": teamId,
    "members.user": user.id,
  });

  if (!teamModel) {
    res.status(403).send();
  }

  const projects = await ProjectsService.findTeamProjects(
    teamModel,
    user,
  );

  return res.json(projects);
}
