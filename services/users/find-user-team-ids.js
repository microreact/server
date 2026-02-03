import { ObjectId } from "mongodb";

import databaseService from "../database.js";

/**
 * Finds teams that a user is a member of.
 * @param  {string} userId - The ID of the user
*/
async function findUserTeamIds(
  userId,
) {
  const db = await databaseService();

  const userTeamsIds = [];
  if (userId) {
    const teams = await db.models.Team.find(
      { "members.user": new ObjectId(userId) },
      { id: 1 },
      { lean: true },
    );
    for (const team of teams) {
      userTeamsIds.push(team.id);
    }
  }

  return userTeamsIds;
}

export default findUserTeamIds;
