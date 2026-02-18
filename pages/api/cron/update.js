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

  const projectsCount = await db.collection("projects").count({ numEntries: { $exists: false } });
  const projectsCursor = db.collection("projects").find({ numEntries: { $exists: false } });
  
  const updateProject = async (doc, currentIndex) => {
    console.info("Updating project %s / %s. %s \r", currentIndex, projectsCount, doc.id);
    try {
      const jsonDocument = await ProjectsService.toViewerJson(doc);
      const numEntries = await countEntries(jsonDocument);
      await db.collection("projects").updateOne({ _id: doc._id }, { $set: { numEntries } });
    }
    catch (err) {
      console.error("Error updating project %s: %s", doc.id, err);
    }
  };

  const concurrencyLimit = 4;
  const batch = [];
  
  for await (const doc of projectsCursor) {
    batch.push(updateProject(doc, index));
    index += 1;
    
    if (batch.length >= concurrencyLimit) {
      await Promise.all(batch);
      batch.length = 0;
    }
  }
  
  // Process remaining items
  if (batch.length > 0) {
    await Promise.all(batch);
  }

  return res.status(200).json({ success: true });
}
