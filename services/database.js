const connect = require("cgps-application-server/db/connect");
const mongoose = require("mongoose");

const serverRuntimeConfig = require("../utils/server-runtime-config");

// mongoose.set('debug', true);

// export function toObjectId(value) {
//   if (typeof value === "string") {
//     return new mongoose.Types.ObjectId(value);
//   }
//   else {
//     return value;
//   }
// }

export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export function toObjectId(value) {
  return mongoose.Types.ObjectId(value);
}

export default async function connectToDatabase() {
  const db = connect({
    // overwriteModels: true,
    // useFindAndModify: true,
    url: serverRuntimeConfig.mongodb.url,
  });

  require("../models/project");
  require("../models/user");
  require("../models/folder");

  return db;
}
