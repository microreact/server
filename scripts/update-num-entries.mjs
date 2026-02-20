import mongodb from "mongodb";
import { createInterface } from "readline";

async function main() {
  // eslint-disable-next-line import/no-unresolved
  const config = await import("./config.json", { assert: { type: "json" } });
  const client = new mongodb.MongoClient(config.mongodb.url);

  await client.connect();
  const db = client.db();
  const collection = db.collection("projects");

  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: false,
  });

  const data = [];
  for await (const line of rl) {
    const [projectId, numEntries] = line.trim().split(" ");

    if (!projectId || !numEntries) {
      console.error(`Invalid line format: ${line}`);
      throw new Error(`Invalid line format: ${line}`);
    }

    data.push([
      projectId,
      parseInt(numEntries, 10),
    ]);
  }

  console.debug(`Read ${data.length} lines from stdin`);

  let batchNo = 0;
  const operations = [];
  for (const [ projectId, numEntries ] of data) {
    operations.push({
      updateOne: {
        filter: { _id: new mongodb.ObjectId(projectId) },
        update: { $set: { numEntries: parseInt(numEntries, 10) } },
      },
    });

    // Execute bulk writes in batches of 1000
    if (operations.length >= 1000) {
      const result = await collection.bulkWrite(operations);
      console.error(`Updated ${result.modifiedCount} documents`);
      operations.length = 0;
    }

    batchNo += 1;
    if (batchNo % 100 === 0) {
      console.error(`Prepared ${batchNo} operations`);
    }
  }

  // Write remaining operations
  if (operations.length > 0) {
    const result = await collection.bulkWrite(operations);
    console.error(`Updated ${result.modifiedCount} documents`);
  }

  console.error(`Processed ${data.length} lines from stdin`);

  await client.close();
}

main()
  .catch((err) => {
    console.error("Error in update script", err);
    process.exit(1);
  });
