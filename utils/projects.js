import * as Api from "./api-client";

async function tryFileAccess(fileBlob) {
  try {
    const stream = fileBlob.stream();
    const reader = stream.getReader();
    await reader.read();
    return true;
  }
  catch (err) {
    console.error(err);
    throw new Error(`Cannot access file ${fileBlob.name} becasue it has been renamed, moved, or deleted.`);
  }
}

async function storeFilesOnServer(projectJson) {
  for (const file of Object.values(projectJson.files)) {
    if (file.blob) {
      await tryFileAccess(file.blob, file.name);
      const { hash, url } = await Api.storeFile(file.blob);
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
