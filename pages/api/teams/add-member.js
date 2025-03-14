import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import logger from "cgps-stdlib/logger/index.js";
import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";
import sendEmailMessage from "cgps-stdlib/emails/send-email-message.js";
import renderEmailMessage from "cgps-stdlib/emails/render-email-message.js";

import databaseService from "../../../services/database.js";

const roleLabels = {
  "viewer": "view",
  "manager": "manage",
};

async function handler(req, res) {
  const db = await databaseService();

  // Only logged in users can send share requests
  const user = await requireUserMiddleware(req, res);

  const { emails, team, role = "viewer" } = req.body;

  if (!Array.isArray(emails) || emails.length > 30) {
    throw new ApiError(400);
  }

  const teamModel = await db.models.Team.findOne({
    id: team,
    owner: user.id,
  });

  if (!teamModel) {
    throw new ApiError(403);
  }

  if (!(role in roleLabels)) {
    throw new ApiError(400, "invalid role");
  }

  for (const email of emails) {
    let invite = await (
      db.models.Invite.findOne({
        "email": email,
        "team": teamModel.id,
      })
    );

    if (!invite) {
      invite = await db.models.Invite.create({
        "email": email,
        "owner": user.id,
        "team": teamModel.id,
        "role": role,
      });
    }

    invite.role = role;
    invite.createdAt = new Date();

    const message = await renderEmailMessage(
      "team-invite",
      {
        role: roleLabels[role],
        tokenToSend: invite.token,
        senderName: user.name,
        teamName: teamModel.name,
      },
    );

    logger.debug(
      { email, role, user: user.id, team: teamModel.id },
      "sending team invite",
    );

    await sendEmailMessage(
      email,
      message,
    );

    await invite.save();
  }

  res.status(200).send(true);
}

export default catchApiErrors(handler);
