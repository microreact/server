import catchApiErrors from "cgps-stdlib/errors/catch-api-errors.js";
import ApiError from "cgps-stdlib/errors/api-error.js";

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

async function handler(req, res) {
  const db = await databaseService();

  const user = await getUserMiddleware(req, res);

  if (!req.query.project) {
    throw new ApiError(400);
  }

  const [ projectIdOrSlug, stateId ] = req.query.project.split("/");

  const projectModel = await db.models.Project.findByIdentifier(
    projectIdOrSlug,
    "viewer",
    user?.id,
  );

  if (!!projectModel.binned) { // eslint-disable-line no-extra-boolean-cast
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

  jsonDocument._ = projectModel.getProjectProps(user);

  return res.json(jsonDocument);
}

export default catchApiErrors(handler);
