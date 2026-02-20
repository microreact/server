import stream from "stream";
import fs from "fs";
import path from "path";
import readline from "readline";
import { MongoClient } from "mongodb";
import promiseMapLimit from "promise-map-limit";
import xlsx from "xlsx";
import { finished } from "stream/promises";

function hashToPath(hash) {
  return path.resolve(
    ".",
    "files",
    hash.substr(0, 2),
    `${hash.substr(2)}.gz`,
  );
}

function base64ToBlob(base64) {
  return fetch(base64).then((res) => res.blob());
}

function blobify(input) {
  if (input && typeof input === "string") {
    if (input.startsWith("data:")) {
    // if (/^data:.*\/.*;base64,/i.test(input)) {
      return base64ToBlob(input);
    }
    else {
      return new Blob([ input ], { type: input.format });
    }
  }
  if (input instanceof Blob) {
    return input;
  }
  console.error(input);
  throw new Error("Cannot convert input to Blob");
}

async function urlToBuffer(source) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => {
      console.warn(`Fetch timed out for ${source}, aborting...`);
      controller.abort();
    },
    5_000,
  );
  let res;
  try {
    // Timeout only until headers are received.
    res = await fetch(source, { signal: controller.signal });
  }
  finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function countCsvRowsFromBuffer(
  buffer,
  { skipHeader = true } = {},
) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Input must be a Buffer");
  }

  // Convert buffer to readable stream
  const inputStream = stream.Readable.from(buffer.toString("utf8"));

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  let rowCount = 0;

  rl.on(
    "line",
    () => {
      rowCount += 1;
    },
  );

  await finished(rl);

  if (skipHeader && rowCount > 0) {
    rowCount -= 1;
  }

  return rowCount;
}

async function countExcelRowsFromBuffer(
  buffer,
  { sheetName, skipHeader = false } = {}
) {
  // Read workbook from buffer
  const workbook = xlsx.read(buffer, { type: "buffer" });

  const targetSheetName = sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${targetSheetName}" not found`);
  }

  if (!worksheet["!ref"]) {
    return 0; // Empty sheet
  }

  const range = xlsx.utils.decode_range(worksheet["!ref"]);
  let rowCount = range.e.r - range.s.r + 1;

  if (skipHeader && rowCount > 0) {
    rowCount -= 1;
  }

  return rowCount;
}

async function countEntriesInFile(file) {
  if (file.format === "data") {
    return file.blob.length;
  }

  let buffer;

  if (file.url) {
    if (file.url.startsWith("ftp://")) {
      return -10;
    }

    if (file.url.startsWith("https://dev.microreact.org/") || file.url.startsWith("https://beta.microreact.org/")) {
      return -20;
    }

    else if (file.url.includes("/api/files/raw?")) {
      const [ _, fileHash ] = file.url.split("?");
      const filePath = hashToPath(fileHash);
      console.debug("Getting buffer from ", { fileHash, filePath });
      buffer = await fs.promises.readFile(filePath);
    }

    else {
      buffer = await urlToBuffer(file.url);
    }
  }

  if (file.blob) {
    const blob = await blobify(file.blob);
    buffer = Buffer.from(await blob.arrayBuffer());
  }

  if (file.format === "text/csv") {
    return countCsvRowsFromBuffer(buffer);
  }

  if (file.format === "application/x-speadsheet") {
    return countExcelRowsFromBuffer(buffer);
  }

  throw new Error(`Unsupported file format for counting entries: ${file.format}`);
}

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

  return countEntriesInFile(file);
}

async function main() {
  // eslint-disable-next-line import/no-unresolved
  const config = await import("./config.json", { assert: { type: "json" } });
  const client = new MongoClient(config.mongodb.url);

  await client.connect();

  const db = client.db();

  const BATCH_SIZE = 100;
  const CONCURRENCY = 8;

  let totalProcessed = 0;
  const projectsCount = await db.collection("projects").countDocuments({ numEntries: { $exists: false } });

  console.info("Total projects to update: %s", projectsCount);

  // eslint-disable-next-line no-constant-condition, no-unreachable-loop
  while (true) {
    const batch = await db.collection("projects")
      .find({ numEntries: { $exists: false } })
      .limit(BATCH_SIZE)
      .toArray();

    if (batch.length === 0) {
      break;
    }

    const process = async (doc) => {
      console.info("Updating project %s / %s. %s version %s \r", totalProcessed, projectsCount, doc.id, doc.version);
      try {
        if (doc.version > 1 || doc.json.schema) {
          console.debug("Counting entries for project %s using new method", doc.id);
          const numEntries = await countEntries(doc.json);
          await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries } });
        }
        else if (doc.json.dataUrl) {
          const file = {
            url: doc.json.dataUrl,
            format: "text/csv",
          };
          const numEntries = await countEntriesInFile(file);
          await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries } });
        }
        else if (doc.json.dataFile) {
          const file = {
            blob: doc.json.dataFile,
            format: "text/csv",
          };
          const numEntries = await countEntriesInFile(file);
          await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries } });
        }
        else {
          console.warn("Project %s has no identifiable data source for counting entries", doc.id);
          await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries: -1 } });
        }
      }
      catch (err) {
        console.error("Error updating project %s: %s", doc.id, err);
        await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries: 0 } });
      }
      totalProcessed += 1;
    };

    await promiseMapLimit(
      batch,
      CONCURRENCY,
      process,
    );

    // for (const doc of batch) {
    //   await process(doc);
    // }

    console.info("Processed %s / %s projects", totalProcessed, projectsCount);
  }

  console.info("Finished updating projects. Processed %s projects.", totalProcessed);

  await client.close();
}

// export default main;

main()
  .catch((err) => {
    console.error("Error in update script", err);
    process.exit(1);
  });
