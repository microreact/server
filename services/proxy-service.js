import axios from "axios";
import JSFtp from "jsftp";
import { google } from "googleapis";

function parseAuth(authInput) {
  if (authInput) {
    const auth = authInput.split(":");
    if (auth[0] && auth[1]) {
      return {
        user: auth[0],
        pass: auth[1],
      };
    }
  }
  return {};
}

function processFtpUrl(rawUrl) {
  let url = String(rawUrl);
  url = url.trim();
  url = require("url").parse(url);
  url.port = url.port || 21;

  const auth = parseAuth(url.auth);
  url.user = auth.user || "anonymous";
  url.pass = auth.pass || "anonymous@";

  // in order to save a CWD round trip
  // stripping the forward slash for files
  // at the apex of the FTP list
  // wu-ftpd + anonymous fails on these
  const pathElements = url.pathname.split("/");
  let pathftp;
  if (pathElements.length === 2) {
    pathftp = url.pathname.substring(1);
  } else {
    pathftp = url.pathname;
  }

  // ftp breaks on %20 and other stuff like this
  url.path = decodeURIComponent(pathftp);

  return url;
}

function getFtpUrl(url) {
  const urlInfo = processFtpUrl(url);
  const ftpConnection = new JSFtp({
    host: urlInfo.host,
    port: urlInfo.port,
    user: urlInfo.user,
    pass: urlInfo.pass,
  });
  return new Promise((resolve, reject) => {
    ftpConnection.get(urlInfo.path, (err, socket) => {
      if (err) {
        reject(err);
      }
      socket.resume();
      resolve({ stream: socket });
    });
  });
}

async function getGoogleClient() {
  return google.auth.getClient({
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.appdata",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

async function getGoogleDriveStream(fileId) {
  const authClient = await getGoogleClient();
  const drive = google.drive({ version: "v3", auth: authClient });
  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    { responseType: "stream" },
  );
  return { stream: response.data };
}

function getStream(
  url,
  headers,
) {
  return axios({
    method: "get",
    url,
    responseType: "stream",
    headers,
  })
    .then(
      (response) => ({
        status: response.status,
        headers: response.headers,
        stream: response.data,
      })
    );
}

function rewriteUrl(
  url,
  headers,
) {
  let match = null;

  // Dropbox shared files, converts links from:
  // https://www.dropbox.com/s/isgyjgaulci4w3x/data.csv?dl=0 to:
  // https://www.dropbox.com/s/isgyjgaulci4w3x/data.csv?dl=1
  const dropboxShareRegexp = /^(https?:\/\/www\.dropbox\.com\/.+\?dl=)0$/;
  if ((match = dropboxShareRegexp.exec(url)) && match[1]) {
    return getStream(`${match[1]}1`);
  }

  // Google Drive shared files, converts links from:
  // https://drive.google.com/file/d/0B8VUXsoIMe56bW9SaU4ycmJ1MkU/view?usp=sharing or
  // https://drive.google.com/open?id=0B8VUXsoIMe56bW9SaU4ycmJ1MkU to:
  // https://drive.google.com/uc?export=download&confirm=no_antivirus&id=0B8VUXsoIMe56bW9SaU4ycmJ1MkU
  const googleDriveRegexp = /^^https:\/\/drive\.google\.com\/(?:file\/d\/|drive\/folders\/|drive\/u\/\d+\/folders\/|open\?id=)([A-Z0-9\_-]+)/i;
  if ((match = googleDriveRegexp.exec(url)) && match[1]) {
    return getGoogleDriveStream(match[1]);
  }
  const googleDriveDownloadRegexp = /^https:\/\/drive\.google\.com\/uc\?.+id=([A-Z0-9\_-]+)&?.*/i;
  if ((match = googleDriveDownloadRegexp.exec(url)) && match[1]) {
    return getGoogleDriveStream(match[1]);
  }

  // Google Spreadsheets files, converts links from:
  // https://docs.google.com/spreadsheets/d/1BzQjYoBnkWxR7h9jX-m5_9uUXdHHNW40K-UvlaFYvkQ/edit?usp=sharing to:
  // https://docs.google.com/spreadsheets/d/1BzQjYoBnkWxR7h9jX-m5_9uUXdHHNW40K-UvlaFYvkQ/export?format=csv
  const googleSpreadsheetRegexp = /^(https?:\/\/docs\.google\.com\/spreadsheets\/d\/.+)\/(.*)$/;
  if ((match = googleSpreadsheetRegexp.exec(url)) && match[1]) {
    if (/^pub/.test(match[2])) {
      return getStream(`${match[1]}/pub?output=csv&format=csv`);
    }
    return getStream(`${match[1]}/export?output=csv&format=csv`);
  }

  // // Figshare files, converts links from:
  // // https://figshare.com/s/add1e9fd99dfcfae987f to:
  // // https://ndownloader.figshare.com/files/4850722?private_link=ff1c38e57795230d9c4c
  // const figshareRegexp = /^https?:\/\/figshare\.com\/s\/(.+)$/;
  // if ((match = figshareRegexp.exec(url)) && match[1]) {
  //   showFigsgareWarning();
  //   return {
  //     type: 'figshare',
  //     url: '',
  //   };
  // }

  const { protocol } = new URL(url);

  if (protocol === "ftp:") {
    return getFtpUrl(url);
  }

  return getStream(url, headers);
}

export default {
  getStream: rewriteUrl,
};
