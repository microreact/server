import { ApiError } from "next/dist/server/api-utils";
import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import logger from "cgps-application-server/logger";

import * as ProjectsService from "../../../services/projects";
import databaseService from "../../../services/dataabse";

export default async function (req, res) {
  const user = await requireUserMiddleware(req, res);

  const projectModel = await ProjectsService.getProjectDocument(req.query?.project, user);

  if (!projectModel.hasOnwerAccess(user)) {
    throw new ApiError(403);
  }

  const db = await databaseService();

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
        });
      }
      else if (share.kind === "invitation") {
        shares.push({
          kind: "invitation",
          createdAt: share.createdAt,
          email: share.email,
        });
      }
    }

    return res.json({
      id: projectModel.id,
      access: projectModel.access,
      alias: projectModel.alias,
      shares,
      url: projectModel.url(),
      aliasUrl: projectModel.alias && projectModel.aliasUrl(),
    });
  }

  if (req.method === "POST") {
    const access = parseInt(req.body.access, 10);

    if (access === 0 || access === 1 || access === 4) {
      projectModel.access = access;
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
