import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import logger from "cgps-stdlib/logger/index.js";
import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";
import sendEmailMessage from "cgps-stdlib/emails/send-email-message.js";
import renderEmailMessage from "cgps-stdlib/emails/render-email-message.js";

import databaseService from "../../../services/database.js";

async function handler(req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const { team } = req.body;

  if (!team || typeof team !== "string") {
    throw new ApiError(400);
  }

  const teamModel = await db.models.Team.findOne({
    id: team,
    owner: user.id,
  });

  if (!teamModel) {
    throw new ApiError(403);
  }

  const data = [];
  for (const member of teamModel.members) {
    const guestUser = await db.models.User.findOne(
      { _id: member.user },
      { email: 1 },
      { lean: true },
    );

    data.push({
      "email": guestUser?.email,
      "role": member.role,
      "added": member.createdAt,
    });
  }

  res.status(200).send(data);
}

export default catchApiErrors(handler);
