import { fetchFile } from "@loaders.gl/core";

export default async function fetcher(originalUrl) {
  if (typeof originalUrl !== "string") {
    return fetchFile(originalUrl);
  }

  let url = originalUrl;
  if (url.startsWith("microreact://")) {
    url = `/api/files/raw?${url.substr(13)}`;
  }
  if (url.startsWith("/")) {
    url = `https://microreact.org${url}`;
  }
  // if (url.startsWith("https://microreact.org/")) {
  //   url = url.substr("https://microreact.org".length);
  // }

  try {
    const content = await fetch(url);
    if (content.type === "cors") {
      throw new TypeError();
    }
    return content;
  }
  catch (error) {
    if (error instanceof TypeError) {
      console.debug("direct fetch failed, will try via proxy"); // eslint-disable-line no-console
      const content = fetch(`/api/files/proxy?url=${encodeURIComponent(url)}`);
      return content;
    }
    else {
      throw error;
    }
  }
}
