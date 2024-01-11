import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";

import databaseService from "../../../services/dataabse.js";

async function handler(req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const model = await db.models.Project.findByIdentifier(
    req.query?.id,
    "manager",
    user?.id,
  );

  const { email, role } = req.body;

  if (!email) {
    throw new ApiError(400, "Invalid email");
  }

  if (!role) {
    throw new ApiError(400, "Invalid role");
  }

  let share;

  share = (
    model.shares.find((x) => x?.email === email && x.kind === "invitation")
  );

  if (share === -1) {
    const invitedUser = await db.models.User.findOne(
      { email },
      { _id: 1 },
      { lean: true },
    );

    if (invitedUser?._id) {
      share = (
        model.shares.find((x) => x?.user.equals(invitedUser._id) && x.kind === "user")
      );
    }
  }

  if (share) {
    share.role = role;
    await model.save();

    res.status(200).send(true);
  }
  else {
    throw new ApiError(400);
  }
}

export default catchApiErrors(handler);
