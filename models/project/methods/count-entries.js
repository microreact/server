const { loadFile } = require("microreact-viewer/utils/files");

const FileStorage = require("../../../services/file-storage");

/**
 * Count the number of data points (rows) in the main dataset
 * @param {Object} projectJson
 * @returns {Number} Total number of entries in the main dataset
 */
async function countEntries(projectJson) {
  // Get the first/main dataset
  const datasets = projectJson.datasets || {};
  const datasetIds = Object.keys(datasets);

  if (datasetIds.length === 0) {
    return 0;
  }

  // Get the first dataset as the main dataset
  const mainDataset = datasets[datasetIds[0]];
  if (!mainDataset || !mainDataset.file) {
    return 0;
  }

  // Get the associated file
  const files = projectJson.files || {};
  const file = files[mainDataset.file];

  if (!file) {
    throw new Error("File not found for the main dataset");
  }

  if (file.url.startsWith("ftp://")) {
    return 0;
  }

  if (file.url.includes("/api/files/raw?")) {
    const [ _, fileHash ] = file.url.split("?");
    file.blob = await FileStorage.readStream(fileHash);
    file.url = undefined;
  }

  const { _content } = await loadFile(file, () => {});

  return _content.rows.length;
}

module.exports = countEntries;
