import { ApiError } from "next/dist/server/api-utils";
import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import databaseService from "../../../services/database";

import accessCodeToAccessLevel from "../../../models/project/statics/access-code-to-access-level.js";
import accessLevelToAccessCode from "../../../models/project/statics/access-level-to-access-code.js";

export default async function (req, res) {
  const user = await requireUserMiddleware(req, res);
  const db = await databaseService();

  const projectModel = await db.models.Project.findByIdentifier(
    req.query?.project,
    "manager",
    user?.id,
  );

  if (req.method === "GET") {
    const sharedWithUserIds = [];

    for (const share of projectModel.shares) {
      if (share.user) {
        sharedWithUserIds.push(share.user);
      }
    }

    const userDocs = await db.models.User.find(
      {
        _id: { $in: sharedWithUserIds },
      },
      {
        email: 1,
      },
      {
        lean: true,
      }
    );
    const userEmailById = new Map();
    for (const userDoc of userDocs) {
      userEmailById.set(userDoc._id.toString(), userDoc.email);
    }

    const shares = [];

    for (const share of projectModel.shares) {
      if (share.kind === "user") {
        shares.push({
          kind: share.kind,
          createdAt: share.createdAt,
          email: userEmailById.get(share.user.toString()),
          role: share.role ?? "viewer",
        });
      }
      else if (share.kind === "invitation") {
        shares.push({
          kind: "invitation",
          createdAt: share.createdAt,
          email: share.email,
          role: share.role ?? "viewer",
        });
      }
    }

    return res.json({
      id: projectModel.id,
      alias: projectModel.alias,
      linkUrl: projectModel.url(),
      aliasUrl: projectModel.alias && projectModel.aliasUrl(),
      accessLevel: accessCodeToAccessLevel(projectModel.access),
      shares,
    });
  }

  if (req.method === "POST") {
    const access = req.body.access;
    if (access === "private" || access === "restricted") {
      projectModel.access = accessLevelToAccessCode(access);
    }
    else {
      throw new ApiError(400, "Bad Request");
    }

    await projectModel.save();

    logger.info("project access level changed", { project: projectModel.id, access }, { user, req, res });

    return res.json(true);
  }

  throw new ApiError(405, "Method Not Allowed");
}
