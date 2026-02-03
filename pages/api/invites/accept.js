import getUserMiddleware from "cgps-application-server/middleware/get-user";

import database from "../../../services/database.js";

export default async function (req, res) {
  const db = await database();

  const user = await getUserMiddleware(req, res);

  if (!user) {
    return res.redirect(`/api/auth/signin?callbackUrl=${req.url}`);
  }

  const token = req.query?.token?.substr(0, 22);

  if (!token) {
    return res.redirect("/errors/invalid-invitation");
  }

  const inviteModel = await db.models.Invite.findOne({ token });

  if (!inviteModel || inviteModel.createdAt < new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)) {
    return res.redirect("/errors/invalid-invitation");
  }

  if (inviteModel.team) {
    const teamModel = await db.models.Team.findOne({ id: inviteModel.team });
    const index = teamModel.members.findIndex((x) => x.user.equals(user.id));
    if (index !== -1) {
      teamModel.members[index].role = inviteModel.role;
    }
    else {
      teamModel.members.push({
        "createdAt": new Date(),
        "role": inviteModel.role ?? "viewer",
        "user": user.id,
      });
    }

    await teamModel.save();
    await inviteModel.remove();

    return res.redirect(teamModel.url());
  }

  if (inviteModel.project) {
    const projectModel = await db.models.Project.findOne({ id: inviteModel.project });
    const index = projectModel.shares.findIndex((x) => x.user.equals(user.id));
    if (index !== -1) {
      projectModel.shares[index].role = inviteModel.role;
    }
    else {
      projectModel.shares.push({
        "createdAt": new Date(),
        "kind": "user",
        "role": inviteModel.role ?? "viewer",
        "user": user.id,
      });
    }

    await inviteModel.remove();

    return res.redirect(projectModel.url());
  }

  return res.redirect("/errors/invalid-invitation");
}
