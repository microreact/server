import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import databaseService from "../../../services/database";
import serverRuntimeConfig from "../../../utils/server-runtime-config";

function calculateDiff(current, previous) {
  if (!Number.isFinite(previous) || previous <= 0) {
    return "+0%";
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent >= 0 ? "+" : ""}${percent}%`;
}

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

  try {
    const db = await databaseService();

    // Get total projects count
    const totalProjects = await db.models.Project.countDocuments({
      binned: { $in: [null, false] },
    });

    // Get total users count
    const totalUsers = await db.models.User.countDocuments();

    // Get total entries count
    const totalEntriesResult = await db.models.Project.aggregate([
      {
        $match: {
          binned: { $in: [null, false] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$numEntries" },
        },
      },
    ]);
    const totalEntries = totalEntriesResult[0]?.total || 0;

    // Get projects grouped by date (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const projectsByDate = await db.models.Project.aggregate([
      {
        $match: {
          createdAt: { $gte: threeMonthsAgo },
          binned: { $in: [null, false] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format project data for charts
    const chartData = projectsByDate.map((item) => ({
      date: item._id,
      projects: Math.min(100, item.count),
    }));

    // Generate today's date
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    // Calculate projects for last 30 days and previous 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const projectsLast30Days = await db.models.Project.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      binned: { $in: [null, false] },
    });

    const projectsPrev30Days = await db.models.Project.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      binned: { $in: [null, false] },
    });

    const usersLast30Days = await db.models.User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const usersPrev30Days = await db.models.User.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const entriesLast30DaysResult = await db.models.Project.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          binned: { $in: [null, false] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$numEntries" },
        },
      },
    ]);
    const entriesLast30Days = entriesLast30DaysResult[0]?.total || 0;

    const entriesPrev30DaysResult = await db.models.Project.aggregate([
      {
        $match: {
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
          binned: { $in: [null, false] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$numEntries" },
        },
      },
    ]);
    const entriesPrev30Days = entriesPrev30DaysResult[0]?.total || 0;

    // Calculate percentage differences
    const projectsDiff = calculateDiff(projectsLast30Days, projectsPrev30Days);
    const usersDiff = calculateDiff(usersLast30Days, usersPrev30Days);
    const entriesDiff = calculateDiff(entriesLast30Days, entriesPrev30Days);

    // Build the stats JSON
    const statsJson = {
      name: "Microreact",
      date: dateString,
      stats: [
        {
          title: "Total projects",
          value: totalProjects,
          label: "Total number of uploaded projects",
          diff: projectsDiff,
        },
        {
          title: "Total users",
          value: totalUsers,
          label: "Total number of users accounts",
          diff: usersDiff,
        },
        {
          title: "Total entries",
          value: totalEntries,
          label: "Total number of entries in projects",
          diff: entriesDiff,
        },
      ],
      charts: [
        {
          title: "Total projects",
          series: ["projects"],
          description: "Total for the last 3 months",
          data: chartData,
        },
      ],
    };

    // Determine S3 bucket and key
    const s3Bucket = serverRuntimeConfig.statsBucket || "cgps-dashboard";
    const s3Key = "microreact.json";

    // Upload to S3
    if (serverRuntimeConfig.storageKey && serverRuntimeConfig.storageSecret) {
      // Configure S3 client
      const s3Client = new S3Client({
        region: serverRuntimeConfig.storageRegion || "eu-west-2",
        credentials: {
          accessKeyId: serverRuntimeConfig.storageKey,
          secretAccessKey: serverRuntimeConfig.storageSecret,
        },
      });

      // Prepare JSON content as buffer
      const jsonContent = JSON.stringify(statsJson);
      const jsonBuffer = Buffer.from(jsonContent);

      // Upload to S3 with dated filename
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: s3Key,
          Body: jsonBuffer,
          ContentType: "application/json",
        })
      );

      return res.status(200).json({ success: true });
    }
    else {
      return res.status(500).json({
        error: "S3 credentials not configured",
      });
    }
  }
  catch (error) {
    console.error("Error generating stats:", error);
    return res.status(500).json({
      error: "Failed to generate stats",
      message: error.message,
    });
  }
}
