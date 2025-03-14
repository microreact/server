import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import databaseService from "../../../services/database";

export default async function (req, res) {
  const user = await requireUserMiddleware(req, res);

  const db = await databaseService();

  const emails = new Set();

  const sharedWithUserIds = await db.models.Project.distinct(
    "shares.user",
    { owner: user.id },
  );

  const userDocs = await db.models.User.find(
    {
      _id: { $in: sharedWithUserIds },
    },
    {
      email: 1,
    },
    {
      lean: true,
      limit: 100,
    }
  );

  for (const userDoc of userDocs) {
    emails.add(userDoc.email);
  }

  const sharedWithEmails = await db.models.Project.distinct(
    "shares.email",
    { owner: user.id },
  );

  for (const doc of sharedWithEmails) {
    emails.add(doc);
  }

  return res.json(Array.from(emails));
}
