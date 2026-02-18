import { Readable } from "stream";
import objectStorage from "cgps-stdlib/object-storage";

import databaseService from "../../../services/database";
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

  try {
    const db = await databaseService();

    // Get total projects count
    const totalProjects = await db.models.Project.countDocuments({
      binned: { $in: [null, false] },
    });

    // Get total users count
    const totalUsers = await db.models.User.countDocuments();

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
      projects: item.count,
    }));

    // Generate today's date
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    // Calculate percentage differences (placeholder values)
    // In a real scenario, you'd compare with previous period
    const projectsDiff = "+1%";
    const usersDiff = "+1%";

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
    const s3Bucket = serverRuntimeConfig.statsBucket || "microreact-stats";
    const s3Key = `stats/stats-${dateString}.json`;

    // Upload to S3
    if (serverRuntimeConfig.storageKey && serverRuntimeConfig.storageSecret) {
      // Prepare JSON content as buffer
      const jsonContent = JSON.stringify(statsJson, null, 2);
      const jsonBuffer = Buffer.from(jsonContent);

      // Helper function to create readable stream from buffer
      const createReadableStream = (buffer) => {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
      };

      // Upload to S3 with dated filename
      await objectStorage.store(
        s3Bucket,
        s3Key,
        createReadableStream(jsonBuffer),
        false,
        {
          ContentType: "application/json",
        }
      );

      // Also save as latest.json for easy access
      await objectStorage.store(
        s3Bucket,
        "stats/latest.json",
        createReadableStream(jsonBuffer),
        false,
        {
          ContentType: "application/json",
        }
      );

      return res.status(200).json({
        success: true,
        message: "Stats generated and uploaded to S3",
        data: {
          bucket: s3Bucket,
          keys: [s3Key, "stats/latest.json"],
          stats: statsJson,
        },
      });
    } else {
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
