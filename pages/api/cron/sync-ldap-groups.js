import ldap from "ldapjs";

import logger from "cgps-application-server/logger";

import databaseService from "../../../services/database";
import serverRuntimeConfig from "../../../utils/server-runtime-config";

function firstValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getStringAttribute(entry, attributeName) {
  const value = firstValue(entry?.[attributeName]);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function extractCn(dn) {
  if (typeof dn !== "string") {
    return null;
  }

  const match = dn.match(/(?:^|,)\s*cn=([^,]+)/i);
  if (!match) {
    return null;
  }

  return match[1].trim() || null;
}

function normaliseSyncGroups(syncGroups) {
  const values = Array.isArray(syncGroups)
    ? syncGroups
    : (typeof syncGroups === "string" ? syncGroups.split(",") : []);

  return values
    .map((group) => {
      if (typeof group === "string") {
        const dn = group.trim();
        return {
          dn,
          name: extractCn(dn),
        };
      }

      if (group && typeof group === "object") {
        const dn = (group.dn || group.groupDn || "").trim();
        const name = (group.name || extractCn(dn) || "").trim();

        return {
          dn,
          name,
        };
      }

      return null;
    })
    .filter((group) => group?.dn && group?.name);
}

function bindClient(client, bindDn, bindCredentials) {
  return new Promise((resolve, reject) => {
    client.bind(bindDn, bindCredentials, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function unbindClient(client) {
  return new Promise((resolve) => {
    client.unbind(() => {
      resolve();
    });
  });
}

function searchEntries(client, baseDn, options) {
  return new Promise((resolve, reject) => {
    const entries = [];

    client.search(baseDn, options, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      response.on("searchEntry", (entry) => {
        entries.push(entry.object || {});
      });

      response.on("error", (searchError) => {
        reject(searchError);
      });

      response.on("end", () => {
        resolve(entries);
      });
    });
  });
}

async function getLdapGroupMemberDns(client, groupDn) {
  const groups = await searchEntries(
    client,
    groupDn,
    {
      scope: "base",
      attributes: [ "dn", "member", "uniqueMember" ],
    },
  );

  if (!groups.length) {
    return [];
  }

  const [ group ] = groups;
  const members = [];

  const memberValue = group.member;
  if (Array.isArray(memberValue)) {
    members.push(...memberValue);
  }
  else if (typeof memberValue === "string") {
    members.push(memberValue);
  }

  const uniqueMemberValue = group.uniqueMember;
  if (Array.isArray(uniqueMemberValue)) {
    members.push(...uniqueMemberValue);
  }
  else if (typeof uniqueMemberValue === "string") {
    members.push(uniqueMemberValue);
  }

  return Array.from(new Set(members.map((value) => value.trim()).filter(Boolean)));
}

async function getLdapMemberProfile(client, memberDn, config) {
  const emailAttribute = config.emailAttribute || "mail";
  const idAttribute = config.idAttribute || "uid";
  const nameAttribute = config.nameAttribute || "displayName";

  const entries = await searchEntries(
    client,
    memberDn,
    {
      scope: "base",
      attributes: [ "dn", emailAttribute, idAttribute, nameAttribute ],
    },
  );

  return entries[0] || null;
}

async function getOrCreateUser(db, profile, config) {
  const emailAttribute = config.emailAttribute || "mail";
  const nameAttribute = config.nameAttribute || "displayName";

  const email = getStringAttribute(profile, emailAttribute);
  if (!email) {
    return null;
  }

  const name = getStringAttribute(profile, nameAttribute);

  let userModel = await db.models.User.findOne({ email });

  if (!userModel) {
    userModel = await db.models.User.create({
      email,
      name: name || email,
    });
  }
  else if (name && !userModel.name) {
    userModel.name = name;
    await userModel.save();
  }

  return userModel;
}

async function syncGroup(db, client, config, group) {
  const memberDns = await getLdapGroupMemberDns(client, group.dn);
  const memberUsers = [];

  for (const memberDn of memberDns) {
    const profile = await getLdapMemberProfile(client, memberDn, config);
    if (!profile) {
      continue;
    }

    const userModel = await getOrCreateUser(db, profile, config);
    if (userModel) {
      memberUsers.push(userModel);
    }
  }

  const usersById = new Map();
  for (const userModel of memberUsers) {
    usersById.set(String(userModel._id), userModel);
  }

  const uniqueUsers = Array.from(usersById.values());

  let teamModel = await db.models.Team.findOne({ name: group.name });
  if (!teamModel) {
    teamModel = await db.models.Team.create({
      name: group.name,
      members: [],
    });
  }

  const existingRolesByUserId = new Map();
  const existingCreatedAtByUserId = new Map();
  for (const member of teamModel.members) {
    existingRolesByUserId.set(String(member.user), member.role || "viewer");
    existingCreatedAtByUserId.set(String(member.user), member.createdAt || new Date());
  }

  teamModel.members = uniqueUsers.map((userModel) => ({
    user: userModel._id,
    role: existingRolesByUserId.get(String(userModel._id)) || "viewer",
    createdAt: existingCreatedAtByUserId.get(String(userModel._id)) || new Date(),
  }));

  const memberIds = new Set(uniqueUsers.map((userModel) => String(userModel._id)));
  if (!teamModel.owner || !memberIds.has(String(teamModel.owner))) {
    teamModel.owner = uniqueUsers[0]?._id;
  }

  await teamModel.save();

  return {
    ldapGroupDn: group.dn,
    teamId: teamModel.id,
    teamName: teamModel.name,
    membersSynced: uniqueUsers.length,
  };
}

export default async function handler(req, res) {
  const cronSecret = req.headers["x-cron-secret"];
  if (!cronSecret || cronSecret !== serverRuntimeConfig.cronSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const config = serverRuntimeConfig?.auth?.ldap;
  if (!config) {
    return res.status(400).json({ error: "LDAP configuration is missing" });
  }

  const syncGroups = normaliseSyncGroups(config.syncGroups);
  if (!syncGroups.length) {
    return res.status(400).json({ error: "No LDAP sync groups configured" });
  }

  const db = await databaseService();

  const ldapClient = ldap.createClient({
    url: config.url,
    timeout: config.timeout,
    connectTimeout: config.connectTimeout,
    tlsOptions: config.tlsOptions,
    reconnect: false,
  });

  try {
    await bindClient(ldapClient, config.bindDn, config.bindCredentials);

    const groups = [];
    for (const group of syncGroups) {
      groups.push(
        await syncGroup(db, ldapClient, config, group),
      );
    }

    return res.status(200).json({
      groups,
      totalGroups: groups.length,
    });
  }
  catch (error) {
    logger.error(error, "failed to sync LDAP groups");
    return res.status(500).json({ error: "Failed to sync LDAP groups" });
  }
  finally {
    await unbindClient(ldapClient);
  }
}
