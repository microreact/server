import getUserMiddlewarefrom from "cgps-application-server/middleware/get-user";

import database from "../../../services/database";

function remove(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}

export default async function (req, res) {
  const db = await database();

  const user = await getUserMiddlewarefrom(req, res);

  // Only logged in users can accept a share request
  if (!user) {
    return res.redirect(`/api/auth/signin?callbackUrl=${req.url}`);
  }

  const token = req.query?.token?.substr(0, 22);

  if (!token) {
    return res.redirect("/errors/invalid-invitation");
  }

  const projectModel = await db.models.Project.findOne(
    {
      shares: {
        $elemMatch: {
          token,
        },
      },
    }
  );

  // Check that the project do exist
  if (!projectModel) {
    return res.redirect("/errors/invalid-invitation");
  }

  const invitation = (
    projectModel.shares.find((x) => x.token === token && x.kind === "invitation")
  );

  if (invitation) {
    remove(
      projectModel.shares,
      invitation,
    );

    if (!projectModel.shares.find((x) => x.user?.equals(user.id))) {
      projectModel.shares.push({
        "createdAt": new Date(),
        "kind": "user",
        "role": invitation.role ?? "viewer",
        "token": token,
        "user": user.id,
      });
    }

    await projectModel.save();
  }

  return res.redirect(projectModel.url());
}
