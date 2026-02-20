import { MongoClient } from "mongodb";

async function main() {
  // eslint-disable-next-line import/no-unresolved
  const config = await import("./config.json", { assert: { type: "json" } });
  const client = new MongoClient(config.mongodb.url);

  await client.connect();
  const db = client.db();
  const collection = db.collection("projects");

  const cursor = collection.find(
    { numEntries: { $exists: true } },
    { projection: { _id: 1, numEntries: 1 } },
  );
  let count = 0;

  for await (const doc of cursor) {
    process.stdout.write(`${doc._id} ${doc.numEntries}\n`);
    count += 1;
    if (count % 10_000 === 0) {
      console.error(`Saved ${count} entries to stdout`);
    }
  }
  console.error(`Saved ${count} entries to stdout`);

  await client.close();
}

main()
  .catch((err) => {
    console.error("Error in update script", err);
    process.exit(1);
  });
