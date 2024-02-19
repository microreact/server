import { ApiError } from "next/dist/server/api-utils";
import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import * as ProjectsService from "../../../services/projects";
import databaseService from "../../../services/dataabse";

export default async function (req, res) {
  // Only logged in users can send invitations
  const reqUser = await requireUserMiddleware(req, res);

  const projectModel = await ProjectsService.getProjectDocument(req.query?.project, reqUser);

  if (!projectModel.hasOnwerAccess(reqUser)) {
    throw new ApiError(403);
  }

  const db = await databaseService();

  const { kind, email } = req.body;

  let invitationIndex;

  if (kind === "invitation") {
    invitationIndex = (
      projectModel.shares.findIndex((x) => x?.email === email && x.kind === "invitation")
    );
  }
  else if (kind === "user") {
    const invitationUser = await db.models.User.findOne(
      {
        email,
      },
      {
        _id: 1,
      },
      {
        lean: true,
      }
    );

    if (invitationUser?._id) {
      invitationIndex = (
        projectModel.shares.findIndex((x) => x?.user.equals(invitationUser._id) && x.kind === "user")
      );
    }
  }

  if (invitationIndex >= 0) {
    projectModel.shares.splice(invitationIndex, 1);
    await projectModel.save();

    res.status(200).send();
  }
  else {
    throw new ApiError(400);
  }
}
