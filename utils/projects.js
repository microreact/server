import { blobify } from "microreact-viewer/utils/files.js";
import * as Api from "./api-client.js";

async function tryFileAccess(fileBlob) {
  try {
    const blob = await blobify(fileBlob);
    const stream = blob.stream();
    const reader = stream.getReader();
    await reader.read();
    return true;
  }
  catch (err) {
    console.error(err);
    throw new Error(`Cannot access file ${fileBlob.name} because it has been renamed, moved, or deleted.`);
  }
}

async function storeFilesOnServer(projectJson) {
  for (const file of Object.values(projectJson.files)) {
    if (file.blob) {
      const blob = await blobify(file.blob);
      await tryFileAccess(blob, file.name);
      const { hash, url } = await Api.storeFile(blob);
      file.hash = hash;
      file.url = url;
      file.blob = undefined;
    }
  }
}

export async function saveProjectOnServer(projectJson, linkedProjectId) {
  await storeFilesOnServer(projectJson);

  const savedProjectProps = await Api.saveProject(
    projectJson,
    linkedProjectId,
  );

  window.history.pushState(null, projectJson.meta.name, savedProjectProps.url);

  return savedProjectProps;
}

export async function updateProjectOnServer(projectId, projectJson) {
  await storeFilesOnServer(projectJson);

  const savedProjectProps = await Api.updateProject(
    projectId,
    projectJson,
  );

  window.history.pushState(null, projectJson.meta.name, savedProjectProps.url);

  return savedProjectProps;
}
