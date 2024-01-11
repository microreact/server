/* eslint-disable no-throw-literal */

import swr, { mutate as globalMutate } from "swr";

function apiEndpointHook(endpointUrl) {
  const { data, error, isLoading, isValidating, mutate } = swr(endpointUrl);
  return {
    data,
    isLoading,
    isValidating,
    isError: error,
    mutate,
  };
}

function apiEndpointMutation(endpointUrl, data = undefined, update = true) {
  return globalMutate(
    endpointUrl,
    data,
    update,
  );
}

export function projectAccessHook(projectId) {
  return apiEndpointHook(`/api/projects/access?project=${projectId}`);
}

export function projectAccessMutation(projectId) {
  return apiEndpointMutation(`/api/projects/access?project=${projectId}`);
}

export function userAccessToken() {
  return apiEndpointHook("/api/user/access-token");
}

export function userFoldersDataHook() {
  return apiEndpointHook("/api/user/folders");
}

export function userFoldersMutation(data, update) {
  return apiEndpointMutation("/api/user/folders", data, update);
}

export function userShareEmailsHook() {
  return apiEndpointHook("/api/user/share-emails");
}

export function userProjectsHook() {
  return apiEndpointHook("/api/user/projects");
}

export function userProjectsMutation(data, update) {
  return apiEndpointMutation("/api/user/projects", data, update);
}

export function userSharedProjectsHook() {
  return apiEndpointHook("/api/user/shared-projects");
}

export function showcaseProjectsHook() {
  return apiEndpointHook("/api/showcase/projects");
}
