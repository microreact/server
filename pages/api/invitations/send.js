import shortUUID from "short-uuid";
import { ApiError } from "next/dist/server/api-utils";
import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import { sendEmailMessage, renderEmailMessage } from "../../../services/email-messages";
import * as ProjectsService from "../../../services/projects";

export default async function (req, res) {
  // Only logged in users can send invitations
  const user = await requireUserMiddleware(req, res);

  const projectModel = await ProjectsService.getProjectDocument(req.query?.project, user);

  if (!projectModel.hasOnwerAccess(user)) {
    throw new ApiError(403);
  }

  const { emails } = req.body;

  if (emails.length > 30) {
    throw new ApiError(400);
  }

  for (const email of emails) {
    let invitation = (
      projectModel.shares.find((x) => x.email === email && x.kind === "invitation")
    );

    if (!invitation) {
      invitation = {
        token: shortUUID.generate(),
        email,
        createdAt: new Date(),
        kind: "invitation",
      };
      projectModel.shares.push(invitation);
    }

    const message = await renderEmailMessage(
      "invitation",
      {
        tokenToSend: invitation.token,
        senderName: user.name,
        projectName: projectModel.json.meta.name || "Untitled Project",
      },
    );

    await sendEmailMessage(
      email,
      message,
    );
  }

  await projectModel.save();

  res.status(200).send(true);
}
