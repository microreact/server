import requireUserMiddleware from "cgps-application-server/middleware/require-user";
import databaseService from "../../../services/database";

export default async function (req, res) {
  const user = await requireUserMiddleware(req, res);

  const db = await databaseService();

  const docs = [
  ];

  const projectFolders = await db.models.Folder.find(
    { owner: user.id },
    { name: 1 },
    { rawResult: true },
  );

  for (const folderDoc of projectFolders) {
    if (folderDoc.name) {
      docs.push({
        id: folderDoc.id,
        name: folderDoc.name,
      });
    }
  }

  return res.json(
    docs.sort(
      (a, b) => a.name.localeCompare(b.name)
    )
  );
}
