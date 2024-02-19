const { ApiError } = require("next/dist/server/api-utils");

const fs = require("fs");
const Stream = require("stream");
const path = require("path");
const tmp = require("tmp-promise");
const pathExists = require("path-exists");
const zlib = require("zlib");
const { promisify } = require("util");
// const isGzipStream = require("is-gzip-stream");

const writeFile = require("./writers-digest");
const config = require("../utils/server-runtime-config");
const UrlService = require("./url-service");

const repoPath = path.resolve(config.repoPath);
const tmpPath = path.join(repoPath);

const validHash = /^[a-f0-9]{40}$/;

function createTmpFile() {
  return tmp.file({ tmpdir: tmpPath }).then((data) => data.path);
}

// function isGzip(stream) {
//   return new Promise((resolve, reject) => {
//     isGzipStream(
//       stream,
//       (err, isGzipped, knownStream) => {
//         if (err) {
//           reject(err);
//         }
//         else {
//           resolve([ isGzipped, knownStream ]);
//         }
//       },
//     );
//   });
// }

async function checkFileSize(tmpFilePath, maxFileSizeInBytes) {
  const stats = await fs.promises.stat(tmpFilePath);
  if (stats.size > maxFileSizeInBytes) {
    throw new ApiError(413, "Payload Too Large");
  }
  return tmpFilePath;
}

function hashToPath(hash) {
  if (!validHash.test(hash)) {
    throw new Error("Invalid hash.");
  }
  return path.join(
    repoPath,
    hash.substr(0, 2),
    hash.substr(2) + ".gz",
  );
}

function finished(input) {
  return new Promise((resolve, reject) => {
    Stream.finished(
      input,
      (err) => {
        if (err) {
          reject(err);
        }
        else {
          resolve();
        }
      },
    );
  });
}

function saveContentToTmpFile(content) {
  const gzip = promisify(zlib.gzip);
  return (
    Promise.all([
      createTmpFile(),
      gzip(content),
    ])
      .then(([ tmpFilePath, gzippedContent ]) => {
        return (
          fs.promises.writeFile(tmpFilePath, gzippedContent)
            .then(() => tmpFilePath)
        );
      })
  );
}

function saveStreamToTmpFile(input) {
  const pipeline = promisify(Stream.pipeline);
  return (
    Promise.resolve()
      .then(createTmpFile)
      .then((tmpFilePath) => {
        return pipeline(
          input,
          zlib.createGzip(),
          fs.createWriteStream(tmpFilePath)
        )
          .then(() => tmpFilePath);
        // input
        //   .pipe(zlib.createGzip())
        //   .pipe(fs.createWriteStream(tmpFilePath));
        // return (
        //   finished(input).then(() => tmpFilePath)
        // );
      })
  );
}

function storeFile(tmpFilePath) {
  return new Promise((resolve, reject) => {
    writeFile(
      tmpFilePath,
      repoPath,
      (error, info) => {
        if (error) {
          reject(error);
        }
        else {
          resolve(info.digest);
        }
      },
    );
  });
}

function storeText(content) {
  return (
    Promise.resolve(content)
      .then(saveContentToTmpFile)
      .then(storeFile)
  );
}

function storeStream(input, maxFileSizeInBytes) {
  return (
    Promise.resolve(input)
      .then(saveStreamToTmpFile)
      .then((tmpFilePath) => checkFileSize(tmpFilePath, maxFileSizeInBytes))
      .then(storeFile)
  );
}

function readStream(fileHash) {
  return (
    Promise.resolve(hashToPath(fileHash))
      .then((filePath) => fs.createReadStream(filePath))
      .then((stream) => stream.pipe(zlib.createGunzip()))
      // .then((stream) => isGzip(stream))
      // .then(([ isGzipped, stream ]) => {
      //   if (isGzipped) {
      //     return stream.pipe(zlib.createGunzip());
      //   }
      //   else {
      //     return stream;
      //   }
      // })
  );
}

function readText(fileHash) {
  return (
    readStream(fileHash)
      .then((stream) => {
        stream.setEncoding("utf8");
        return stream;
      })
  );
}

function fileUri(fileHash) {
  // return `microreact://${fileHash}`;
  return UrlService.relative(`api/files/raw?${fileHash}`);
}

function fileSize(fileHash) {
  return (
    Promise.resolve(hashToPath(fileHash))
      .then((filePath) => fs.promises.stat(filePath))
      .then((stats) => stats.size)
  );
}

function hasFile(hash) {
  return (
    Promise.resolve(hashToPath(hash))
      .then(pathExists)
  );
}

module.exports = {
  storeText,
  storeStream,
  readText,
  readStream,
  path: hashToPath,
  uri: fileUri,
  has: hasFile,
  size: fileSize,
};
