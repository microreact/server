import promiseMapLimit from "promise-map-limit";

import countEntries from "../../../models/project/methods/count-entries";
import databaseService from "../../../services/database";
import * as ProjectsService from "../../../services/projects";
import serverRuntimeConfig from "../../../utils/server-runtime-config";

/**
 * Generate stats JSON and save to S3
 * Called via cron job
 * Requires X-Cron-Secret header to match configured secret
 */
export default async function handler(req, res) {
  // Verify cron secret
  const cronSecret = req.headers["x-cron-secret"];
  if (!cronSecret || cronSecret !== serverRuntimeConfig.cronSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = await databaseService();

  const BATCH_SIZE = 1000;
  const CONCURRENCY = 4;

  let totalProcessed = 0;
  const projectsCount = await db.collection("projects").countDocuments({ numEntries: { $exists: false } });

  console.info("Total projects to update: %s", projectsCount);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Load batch of 100 documents
    const batch = await db.collection("projects")
      .find({ numEntries: { $exists: false } })
      .limit(BATCH_SIZE)
      .toArray();

    if (batch.length === 0) {
      break;
    }

    // Process batch with concurrency of 4
    await promiseMapLimit(
      batch,
      CONCURRENCY,
      async (doc, index) => {
        console.info("Updating project %s / %s. %s \r", totalProcessed + index + 1, projectsCount, doc.id);
        await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries: 0 } });
        try {
          const jsonDocument = await ProjectsService.toViewerJson(doc);
          const numEntries = await countEntries(jsonDocument);
          await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries } });
        }
        catch (err) {
          console.error("Error updating project %s: %s", doc.id, err);
        }
      },
    );

    totalProcessed += batch.length;
    console.info("Processed %s / %s projects", totalProcessed, projectsCount);
  }

  return res.status(200).json({ success: true, processed: totalProcessed });
}
