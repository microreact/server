import requireUserMiddleware from "cgps-application-server/middleware/require-user";

import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";

import findProjectByIdentifier from "../../../services/project/find-by-identifier.js";
import databaseService from "../../../services/database.js";

async function handler(req, res) {
  const db = await databaseService();

  const user = await requireUserMiddleware(req, res);

  const model = await findProjectByIdentifier(
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
    model.shares.find((x) => x.kind === "invitation" && x?.email === email)
  );

  if (!share) {
    const invitedUser = await db.models.User.findOne(
      { email },
      { _id: 1 },
      { lean: true },
    );

    if (invitedUser?._id) {
      share = (
        model.shares.find((x) => x.kind === "user" && x.user?.equals(invitedUser._id))
      );
    }
  }

  if (!share) {
    const teamDoc = await db.models.Team.findOne(
      {
        $or: [
          { id: email },
          { name: email },
        ],
      },
      { id: 1 },
      { lean: true },
    );

    if (teamDoc?.id) {
      share = (
        model.shares.find((x) => x.kind === "team" && x.team === teamDoc.id)
      );
    }
    else {
      share = (
        model.shares.find((x) => x.kind === "team" && x.team === email)
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
