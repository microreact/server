import { ApiError } from "next/dist/server/api-utils";
import logger from "cgps-application-server/logger";

import getUserMiddleware from "cgps-application-server/middleware/get-user";

import databaseService from "../../../services/dataabse";
import * as ProjectsService from "../../../services/projects";

async function findProjectState(stateId, projectModel) {
  const db = await databaseService();
  const id = stateId || projectModel.json.defaultView;

  if (typeof id === "string") {
    const stateModel = await db.collection("projectstates").findOne({ project: projectModel._id, id });
    if (stateModel === null) {
      throw new ApiError(404, "not found");
    }

    return stateModel;
  }
  else {
    return undefined;
  }
}

function catchApiErrors(func) {
  return async (req, res) => {
    try {
      await func(req, res);
    }
    catch (err) {
      if (err instanceof ApiError) {
        res.status(err.statusCode).end(err.message);
      }
      else {
        throw err;
      }
    }
  };
}

export default catchApiErrors(async (req, res) => {
  const user = await getUserMiddleware(req, res);

  const [ projectId, stateId ] = req.query.project.split("/");
  const projectModel = await ProjectsService.getProjectDocument(projectId, user);

  // eslint-disable-next-line no-extra-boolean-cast
  if (!!projectModel.binned) {
    throw new ApiError(404, "not found");
  }

  logger.info("project access", { project: projectModel.id }, { user, req, res });

  // Legacy projects (version 1) may have state documents
  if (projectModel.version === 1 && stateId) {
    const viewState = await findProjectState(stateId, projectModel);

    if (viewState) {
      projectModel.savedState = viewState.data;
      projectModel.viewId = viewState.id;
    }
  }

  const jsonDocument = await ProjectsService.toViewerJson(projectModel);

  jsonDocument.meta = jsonDocument.meta || {};
  jsonDocument.meta.createdAt = projectModel.createdAt.toISOString();
  jsonDocument.meta.updatedAt = projectModel.updatedAt.toISOString();

  jsonDocument._ = {};
  jsonDocument._.id = projectModel.id;
  jsonDocument._.version = projectModel.version;
  jsonDocument._.url = projectModel.url();
  jsonDocument._.isOwner = projectModel.hasOnwerAccess(user);
  jsonDocument._.linkedProjectId = projectModel.linkedProjectId;

  return res.json(jsonDocument);
});
