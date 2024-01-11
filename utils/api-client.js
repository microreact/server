/* eslint-disable no-throw-literal */

import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/",
});

function apiRequest(request) {
  return (
    apiClient.request(request)
      .then((res) => res.data)
      .catch((error) => {
        console.error(error);
        throw {
          error,
          code: error?.response?.status,
          status: error?.response?.statusText,
          message: error?.response?.data,
        };
      })
  );
}

export function getProjectJson(projectSlug) {
  return apiRequest({
    method: "get",
    url: "/projects/json",
    params: { project: projectSlug },
  });
}

export function storeFile(fileInput) {
  return apiRequest({
    method: "post",
    url: "/files/store",
    data: fileInput,
    // headers: {
    //   "content-type": fileInput.type || "application/octet-stream",
    // },
  });
}

export function saveProject(projectJson, linkedProjectId) {
  return apiRequest({
    method: "post",
    url: "/projects/create",
    data: projectJson,
    params: { linkedProjectId },
  });
}

export function addShareAccess(projectId, emails, role) {
  return apiRequest({
    data: { emails, role },
    method: "post",
    params: { id: projectId },
    url: "/shares/add",
  });
}

export function updateShareAccess(projectId, email, role) {
  return apiRequest({
    data: { email, role },
    method: "post",
    params: { id: projectId },
    url: "/shares/update",
  });
}

export function removeShareAccess(projectId, email, kind) {
  return apiRequest({
    data: { email, kind },
    method: "post",
    params: { id: projectId },
    url: "/shares/remove",
  });
}

export function revokeInvitation(projectId, kind, email) {
  return apiRequest({
    method: "post",
    url: "/invitations/revoke",
    data: { kind, email },
    params: { project: projectId },
  });
}

export function updateProject(projectId, projectJson) {
  return apiRequest({
    method: "post",
    url: "/projects/update",
    data: projectJson,
    params: { project: projectId },
  });
}

export function updateProjectAccess(projectId, access) {
  return apiRequest({
    method: "post",
    url: "/projects/access",
    data: { access },
    params: { project: projectId },
  });
}

export function updateProjectAlias(projectId, alias) {
  return apiRequest({
    method: "post",
    url: "/projects/alias",
    data: { alias },
    params: { project: projectId },
  });
}

export function updateProjectFolder(projectId, folder) {
  return apiRequest({
    method: "post",
    url: "/projects/move",
    data: { folder },
    params: { project: projectId },
  });
}

export function updateProjectStar(projectId, starred) {
  return apiRequest({
    method: "post",
    url: "/projects/star",
    data: { starred },
    params: { project: projectId },
  });
}

export function updateProjectBin(projectId, binned) {
  return apiRequest({
    method: "post",
    url: "/projects/bin",
    data: { binned },
    params: { project: projectId },
  });
}

export function sendFeedback(feedbackText, emailAddress, screenshotImage) {
  return apiRequest({
    method: "post",
    url: "/feedback/send",
    data: {
      feedbackText,
      emailAddress,
      screenshotImage,
    },
  });
}
