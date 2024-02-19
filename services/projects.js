import { ApiError } from "next/dist/server/api-utils";
import Slugs from "cgps-application-server/utils/slugs";

import createMicroreactDocument from "microreact.js";

import databaseService, { isValidObjectId } from "./dataabse";

/**
 * Finds a project documents by project ID or project slug.
 * @param  {string} projectIdOrSlug - The shortened v4 UUID of the project, or its slug
 * @return {String} The shortened v4 UUID of the project.
 * @throws {ApiError} 400 Invalid request: if the project ID is invalid.
*/
function projectSlugToId(projectIdOrSlug) {
  if (!projectIdOrSlug) {
    throw new ApiError(400, "Invalid request");
  }

  return Slugs.toId(projectIdOrSlug);
}

async function findProjectDocuments(query, user) {
  const docs = [];

  const db = await databaseService();

  const projectDocs = await db.models.Project.find(
    {
      ...query,
      linkedProjectId: null,
    },
    {
      _id: 0,
      "json.meta.description": 1,
      "json.meta.name": 1,
      access: 1,
      alias: 1,
      binned: 1,
      createdAt: 1,
      folder: 1,
      id: 1,
      owner: 1,
      starred: 1,
      updatedAt: 1,
      version: 1,
    },
    {
      sort: { updatedAt: -1 },
      lean: true,
    },
  );

  for (const projectDoc of projectDocs) {
    const isOwner = db.models.Project.prototype.hasOnwerAccess.call(projectDoc, user);
    if (projectDoc?.json?.meta) {
      docs.push({
        id: projectDoc.id,
        name: projectDoc.json.meta.name,
        description: projectDoc.json.meta.description,
        image: projectDoc.json.image,
        createdAt: projectDoc.createdAt,
        updatedAt: projectDoc.updatedAt,
        isOwner,
        access: isOwner ? (projectDoc.access ?? 0) : undefined,
        starred: isOwner ? (projectDoc.starred ?? false) : undefined,
        binned: isOwner ? (projectDoc.binned ?? false) : undefined,
        folder: isOwner ? (projectDoc.folder) : undefined,
        url: db.models.Project.projectUrl(projectDoc.version, projectDoc.id, projectDoc.json.meta.name),
      });
    }
  }

  return docs;
}

/**
 * Checks if a project alias is available.
 * @param  {string} projectAlias - The alias to check
 * @param  {UserModel} user - The signed-in user, or null for anonymous users
 * @return {Boolean} True if the alias is available, otherwise False.
*/
export async function checkProjectAlias(projectAlias, user) {
  const db = await databaseService();

  const projectDocument = await db.models.Project.findOne(
    {
      $or: [
        { alias: projectAlias },
        { id: projectAlias },
      ],
    },
    { id: 1 },
  );

  return !projectDocument;
}

/**
 * Finds a project documents by project ID or project slug.
 * @param  {string} projectIdOrSlug - The shortened v4 UUID of the project, or its slug
 * @param  {UserModel} user - The signed-in user, or null for anonymous users
 * @return {ProjectModel} A Project model if the project is found and the user has access to it, otherwise throws an ApiError.
 * @throws {ApiError} 400 Invalid request: if the project ID is invalid.
 * @throws {ApiError} 404 Not found: if the project is not found.
 * @throws {ApiError} 401 Unauthorized: if the project is not public and the user is anonymous.
 * @throws {ApiError} 403 Forbidden: if the project is not public and the signed-in user does not have access.
*/
export async function getProjectDocument(projectIdOrSlug, user) {
  const db = await databaseService();

  const identifier = projectSlugToId(projectIdOrSlug);

  const projectDocument = await db.models.Project.findOne(
    {
      $or: [
        { id: identifier },
        { alias: identifier },
      ],
    }
  );

  // Check that the project do exist
  if (!projectDocument) {
    throw new ApiError(404);
  }

  // let originalProject = projectDocument;
  // if (projectDocument.linkedProjectId) {
  //   originalProject = await getProjectDocument(projectDocument.linkedProjectId, user);
  // }

  // A private project can be accessed by the user who created it
  if (projectDocument.access === 0) {
    if (user?.id) {
      // a private project can be accessed by the user who created it
      if (!projectDocument.isAccessibleBy(user)) {
        throw new ApiError(403); // Forbidden
      }
    }
    else {
      throw new ApiError(401); // Unauthorized
    }
  }

  return projectDocument;
}

export async function getProjectMetadata(projectIdOrSlug) {
  const db = await databaseService();

  const id = projectSlugToId(projectIdOrSlug);

  const projectDocument = await db.models.Project.findOne(
    {
      id,
      access: 1,
    },
    {
      "json.image": 1,
      "json.meta.image": 1,
      "json.meta.name": 1,
      "json.meta.description": 1,
    },
  );

  if (projectDocument) {
    return {
      image: projectDocument.json.image || projectDocument.json.meta.image,
      name: projectDocument.json.meta.name,
      description: projectDocument.json.description,
    };
  }
  else {
    return undefined;
  }
}

export async function findUserProjects(user) {
  await databaseService();

  const query = {
    owner: user.id,
  };

  return findProjectDocuments(query, user);
}

export async function findUserSharedProjects(user) {
  await databaseService();

  const query = {
    $or: [
      {
        "shares.kind": "user",
        "shares.user": user.id,
      },
    ],
  };

  return findProjectDocuments(query, user);
}

export async function toViewerJson(projectModel) {
  if (projectModel.version > 1) {
    return projectModel.json;
  }

  // Version 1 are projects from Microreact IV
  // We need to convert the schema to Microreact V on-the-fly.

  const json = await createMicroreactDocument({
    name: projectModel.json.meta.name,
    description: projectModel.json.meta.description,
    email: projectModel.json.meta.email,
    website: projectModel.json.meta.website,

    data: projectModel.json.dataUrl || projectModel.json.dataFile,
    tree: projectModel.json.treeUrl || projectModel.json.treeFile,
    network: projectModel.json.networkUrl || projectModel.json.networkFile,

    settings: projectModel.json.settings,

    savedState: projectModel.savedState,
    viewId: projectModel.viewId,
  });

  const FileStore = require("./file-storage");
  for (const file of Object.values(json.files)) {
    if (file.blob) {
      const storedFileHash = await FileStore.storeText(file.blob);
      file.url = FileStore.uri(storedFileHash);
      file.hash = storedFileHash;
      file.size = await FileStore.size(storedFileHash);
      file.blob = undefined;
    }
  }

  return json;
}

export async function findOrCreateUserFolder(user, folderIdOrName) {
  const db = await databaseService();

  let doc;

  if (isValidObjectId(folderIdOrName)) {
    doc = await db.models.Folder.findOne(
      {
        owner: user.id,
        _id: folderIdOrName,
      }
    );
  }

  if (!doc) {
    doc = await db.models.Folder.create(
      {
        owner: user.id,
        name: folderIdOrName,
      }
    );
  }

  return doc;
}
