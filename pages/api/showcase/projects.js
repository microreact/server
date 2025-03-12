import { ApiError } from "next/dist/server/api-utils";

import databaseService, { toObjectId } from "../../../services/database";
import publicRuntimeConfig from "../../../utils/public-runtime-config";
import serverRuntimeConfig from "../../../utils/server-runtime-config";

export default async function (req, res) {
  const db = await databaseService();

  if (!publicRuntimeConfig.customShowcase) {
    throw new ApiError(501);
  }

  const projectDocs = await db.models.Project.find(
    {
      access: 1,
      folder: { $in: serverRuntimeConfig.showcaseFolders.map(toObjectId) },
      binned: { $in: [ null, false ] },
    },
    {
      "_id": 0,
      "json.meta.description": 1,
      "json.meta.name": 1,
      "alias": 1,
      "createdAt": 1,
      "id": 1,
      "updatedAt": 1,
      "version": 1,
    },
    {
      sort: { updatedAt: -1 },
      lean: true,
    },
  );

  const docs = [];

  for (const projectDoc of projectDocs) {
    if (projectDoc?.json?.meta) {
      docs.push({
        id: projectDoc.id,
        name: projectDoc.json.meta.name,
        description: projectDoc.json.meta.description,
        createdAt: projectDoc.createdAt,
        updatedAt: projectDoc.updatedAt,
        url: db.models.Project.projectUrl(projectDoc.version, projectDoc.id, projectDoc.json.meta.name),
        image: db.models.Project.imageUrl(projectDoc.id),
      });
    }
  }

  return res.json(docs);
}
