import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";

import databaseService from "../../../services/database.js";
import findProjectByIdentifier from "../../../services/project/find-by-identifier.js";

async function handler(req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const model = await findProjectByIdentifier(
    req.query?.id,
    "manager",
    user?.id,
  );

  const { email } = req.body;

  let shareIndex;

  shareIndex = (
    model.shares.findIndex((x) => x?.email === email && x.kind === "invitation")
  );

  if (shareIndex === -1) {
    const invitedUser = await db.models.User.findOne(
      { email },
      { _id: 1 },
      { lean: true },
    );

    if (invitedUser?._id) {
      shareIndex = (
        model.shares.findIndex((x) => x?.user.equals(invitedUser._id) && x.kind === "user")
      );
    }
  }

  if (shareIndex >= 0) {
    model.shares.splice(shareIndex, 1);
    await model.save();

    res.status(200).send();
  }
  else {
    throw new ApiError(400);
  }
}

export default catchApiErrors(handler);
