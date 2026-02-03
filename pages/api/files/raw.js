import { ApiError } from "next/dist/server/api-utils";

import getUserMiddleware from "cgps-application-server/middleware/get-user";

import FileStorage from "../../../services/file-storage";
import * as ProjectsService from "../../../services/projects";
import findProjectByIdentifier from "../../../services/project/find-by-identifier";

export const config = {
  api: {
    externalResolver: true,
  },
};

export default async function (req, res) {
  const fileHash = req.query.id || req.query.hash || (Object.keys(req.query)?.[0]);
  if (!fileHash) {
    throw new ApiError(400);
  }

  if (!req.headers?.referer) {
    throw new ApiError(400);
  }
  const refererUrl = new URL(req.headers.referer);

  const user = await getUserMiddleware(req, res);
  const parts = refererUrl.pathname.split("/");
  const projectModel = await findProjectByIdentifier(
    parts[2],
    "viewer",
    user?.id,
  );
  const jsonDocument = await ProjectsService.toViewerJson(projectModel);

  let fileFound = false;
  for (const fileDef of Object.values(jsonDocument.files)) {
    if (fileDef.url && fileDef.url.endsWith(fileHash)) {
      fileFound = true;
      break;
    }
  }
  if (!fileFound) {
    throw new ApiError(400);
  }

  const stream = await FileStorage.readStream(fileHash);

  // res.setHeader("Access-Control-Allow-Origin", "https://vega.github.io");
  res.setHeader("Cache-control", "private, max-age=31536000, immutable");

  stream.pipe(res);
}
