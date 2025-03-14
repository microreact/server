import { ApiError } from "next/dist/server/api-utils";
import Slugs from "cgps-application-server/utils/slugs";

import createMicroreactDocument from "microreact.js";

import databaseService, { isValidObjectId } from "./database";
import findUserTeamIds from "./users/find-user-team-ids";

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
    },
    {
      "_id": 0,
      "access": 1,
      "alias": 1,
      "binned": 1,
      "createdAt": 1,
      "folder": 1,
      "id": 1,
      "json.meta.description": 1,
      "json.meta.name": 1,
      "owner": 1,
      "shares": 1,
      "starred": 1,
      "updatedAt": 1,
      "version": 1,
    },
    {
      sort: { updatedAt: -1 },
      lean: true,
    },
  );

  for (const projectDoc of projectDocs) {
    const role = db.models.Project.prototype.getUserRole.call(projectDoc, user?.id);
    const hasOnwerAccess = (role === "owner");
    if (projectDoc?.json?.meta) {
      docs.push({
        "id": projectDoc.id,
        "name": projectDoc.json.meta.name,
        "description": projectDoc.json.meta.description,
        "image": projectDoc.json.image,
        "createdAt": projectDoc.createdAt,
        "updatedAt": projectDoc.updatedAt,
        "role": role,
        "isOwner": hasOnwerAccess,
        "shared": !hasOnwerAccess,
        "access": hasOnwerAccess ? (projectDoc.access ?? 0) : undefined,
        "starred": hasOnwerAccess ? (projectDoc.starred ?? false) : undefined,
        "binned": hasOnwerAccess ? (projectDoc.binned ?? false) : undefined,
        "folder": hasOnwerAccess ? (projectDoc.folder) : undefined,
        "url": db.models.Project.projectUrl(projectDoc.version, projectDoc.id, projectDoc.json.meta.name),
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

  const userTeamsIds = await findUserTeamIds(user?.id);

  const query = {
    $or: [
      {
        "shares.kind": "user",
        "shares.user": user.id,
      },
      {
        "shares.kind": "team",
        "shares.team": { $in: userTeamsIds },
      },
    ],
  };

  return findProjectDocuments(query, user);
}

export async function findTeamProjects(team, user) {
  const query = {
    "shares.kind": "team",
    "shares.team": { $in: team.id },
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
