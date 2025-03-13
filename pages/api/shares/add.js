import shortUUID from "short-uuid";

import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import logger from "cgps-stdlib/logger/index.js";
import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";
import sendEmailMessage from "cgps-stdlib/emails/send-email-message.js";
import renderEmailMessage from "cgps-stdlib/emails/render-email-message.js";

import projectSharingRoles from "../../../services/project/share-roles.js";
import findProjectByIdentifier from "../../../services/project/find-by-identifier.js";

async function handler(req, res) {

  // Only logged in users can send share requests
  const user = await requireUserMiddleware(req, res);

  const model = await findProjectByIdentifier(
    req.query?.id,
    "manager",
    user?.id,
  );

  const { emails, role } = req.body;

  if (!(role in projectSharingRoles)) {
    throw new ApiError(400, "invalid role");
  }

  if (emails.length > 30) {
    throw new ApiError(400);
  }

  for (const email of emails) {
    let invitation = (
      model.shares.find((x) => x.email === email)
    );

    if (!invitation) {
      invitation = {
        "token": shortUUID.generate(),
        "email": email,
        "kind": "invitation",
        "role": role,
        "createdAt": new Date(),
      };
      model.shares.push(invitation);
    }

    invitation.role = role;
    invitation.createdAt = new Date();

    const message = await renderEmailMessage(
      "invitation",
      {
        role: roleLabels[role],
        tokenToSend: invitation.token,
        senderName: user.name,
        projectName: model.json.meta.name || "Untitled Project",
      },
    );

    logger.debug(
      { email, role, user: user.id, project: model.id },
      "sending invitation"
    );

    await sendEmailMessage(
      email,
      message,
    );
  }

  await model.save();

  res.status(200).send(true);
}

export default catchApiErrors(handler);
