import shortUUID from "short-uuid";

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

  const user = await requireUserMiddleware(req, res);

  const { emails, team } = req.body;

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

  for (const email of emails) {
    const invitedUser = await db.models.User.findOne(
      { email },
      { _id: 1 },
      { lean: true },
    );

    if (invitedUser?._id) {
      const memberIndex = (
        teamModel.members.findIndex((x) => x.user.equals(invitedUser._id))
      );

      if (memberIndex >= 0) {
        logger.debug(
          { email, user: user.id, team: teamModel.id },
          "removing member from team",
        );

        teamModel.members.splice(memberIndex, 1);
        continue;
      }
    }

    throw new ApiError(400);
  }

  await teamModel.save();

  res.status(200).send(true);
}

export default catchApiErrors(handler);
