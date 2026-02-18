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

  let index = 0;
console.log({db})
  const projectsCount = await db.collection("projects").count({ numEntries: { $exists: false } });
  const projectsCursor = db.collection("projects").find({ numEntries: { $exists: false } });
  for await (const doc of projectsCursor) {
    console.info("Updating project %s / %s. %s \r", index, projectsCount, doc.id);

    const jsonDocument = await ProjectsService.toViewerJson(doc);

    const numEntries = await countEntries(jsonDocument);

    await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries } });

    index += 1;
  }

  return res.status(200).json({ success: true });
}
